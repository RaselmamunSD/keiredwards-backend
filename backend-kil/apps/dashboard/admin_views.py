import json
from datetime import timedelta, date
from decimal import Decimal
from django.utils import timezone
from django.views.generic import TemplateView
from django.contrib.auth.mixins import UserPassesTestMixin
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from apps.accounts.models import User
from apps.payments.models import Payment, CheckInOption, AddOnOption
from apps.dashboard.models import (
    CheckInHistoryRecord,
    CheckInScheduleConfig,
    ActiveService,
    PressReleaseConfig,
    CheckInEmailConfig,
    TrustedRecipient,
    BillingRecord,
    SetupAccountingConfig,
)


def _serialize_date(val):
    """Safely convert date/datetime to string."""
    if val is None:
        return "—"
    if hasattr(val, 'strftime'):
        return val.strftime("%m/%d/%Y")
    return str(val)


def _safe_float(val):
    """Safely convert any value to float."""
    try:
        return float(str(val).replace(',', '').replace('$', ''))
    except Exception:
        return 0.0


def _build_admin_data():
    """
    Builds all admin dashboard data from the database.
    Returns a dict with all the JSON-serializable data.
    """
    now = timezone.now()
    today = now.date()
    yesterday = today - timedelta(days=1)

    # ── 1. USERS ──────────────────────────────────────────────────────────────
    users = []
    for u in User.objects.select_related('checkin_schedule_config').order_by('email'):
        schedule = getattr(u, 'checkin_schedule_config', None)
        freq = "Weekly"
        if schedule and schedule.purchased_plan:
            plan = schedule.purchased_plan.lower()
            if "daily" in plan:
                freq = "Daily"
            elif "monthly" in plan:
                freq = "Monthly"
            elif "yearly" in plan or "annual" in plan:
                freq = "Yearly"
            elif "quarterly" in plan:
                freq = "Quarterly"

        checkins = CheckInHistoryRecord.objects.filter(user=u).count()
        is_paused = schedule.paused if schedule else False
        status = "Paused" if is_paused else ("Active" if u.is_active else "Inactive")
        tag_class = "tag tag-neutral" if (is_paused or not u.is_active) else "tag tag-accent"

        users.append({
            "email": u.email,
            "frequency": freq,
            "next": schedule.renewal_date if schedule and schedule.renewal_date else "—",
            "status": status,
            "tagClass": tag_class,
            "expiration": schedule.renewal_date if schedule and schedule.renewal_date else "—",
            "checkins": checkins,
        })

    # ── 2. ACCOUNTING ORDERS ──────────────────────────────────────────────────
    orders = []
    for b in BillingRecord.objects.select_related('user').order_by('-id'):
        amount_val = _safe_float(b.amount)
        orders.append({
            "invoice": f"26-{str(b.id).zfill(5)}",
            "date": b.date,
            "email": b.user.email if b.user else "Unknown",
            "items": [{"name": b.description or "Service", "qty": 1, "unitPrice": amount_val}],
            "paymentType": "PayPal",
            "confirmation": f"CONF-{b.id + 88212}",
            "tax": 0,
            "startDate": b.date,
            "endDate": "—",
        })

    # ── 3. REVENUE CALCULATIONS ───────────────────────────────────────────────
    revenue_today = Decimal('0')
    revenue_week = Decimal('0')
    revenue_month = Decimal('0')
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)

    for p in Payment.objects.filter(status='completed'):
        created_date = p.created_at.date() if p.created_at else None
        if created_date is None:
            continue
        if created_date == today:
            revenue_today += p.amount
        if created_date >= week_start:
            revenue_week += p.amount
        if created_date >= month_start:
            revenue_month += p.amount

    # ── 4. CHECK-IN STATS ─────────────────────────────────────────────────────
    checkins_today_count = CheckInHistoryRecord.objects.filter(
        created_at__date=today
    ).count()
    missed_yesterday = 0
    try:
        # Users who were supposed to check in yesterday but didn't
        missed_yesterday = CheckInHistoryRecord.objects.filter(
            created_at__date=yesterday
        ).count()
    except Exception:
        missed_yesterday = 0

    new_clients_today = User.objects.filter(date_joined__date=today).count()

    # ── 5. STAT CARDS ─────────────────────────────────────────────────────────
    stat_cards = [
        {"label": "Check-ins Today", "value": checkins_today_count, "trend": "", "key": "checkinsToday"},
        {"label": "Missed Check-ins Yesterday", "value": missed_yesterday, "trend": "", "key": "missedCheckins"},
        {"label": "New Clients Today", "value": new_clients_today, "trend": "", "key": "newClients"},
        {"label": "Revenue Today", "value": f"${float(revenue_today):,.2f}", "trend": "", "key": "revenueToday"},
        {"label": "Revenue This Week", "value": f"${float(revenue_week):,.2f}", "trend": "", "key": "revenueWeek"},
        {"label": "Revenue This Month", "value": f"${float(revenue_month):,.2f}", "trend": "", "key": "revenueMonth"},
    ]

    # ── 6. EXPIRY CARDS ───────────────────────────────────────────────────────
    def count_expiring_in(days):
        target_date = today + timedelta(days=days)
        count = 0
        for s in CheckInScheduleConfig.objects.all():
            try:
                # renewal_date is stored as string "MM/DD/YYYY"
                from datetime import datetime
                rd = datetime.strptime(s.renewal_date, "%m/%d/%Y").date()
                diff = (rd - today).days
                if 0 <= diff <= days:
                    count += 1
            except Exception:
                pass
        return count

    expiry_cards = [
        {"label": "Expires in 90 Days", "value": count_expiring_in(90), "trend": "", "key": "expires90"},
        {"label": "Expires in 60 Days", "value": count_expiring_in(60), "trend": "", "key": "expires60"},
        {"label": "Expires in 30 Days", "value": count_expiring_in(30), "trend": "", "key": "expires30"},
        {"label": "Expires in 14 Days", "value": count_expiring_in(14), "trend": "", "key": "expires15"},
        {"label": "Expires in 5 Days", "value": count_expiring_in(5), "trend": "", "key": "expires5"},
        {"label": "Expires in 1 Day", "value": count_expiring_in(1), "trend": "", "key": "expires1"},
    ]

    # ── 7. PRICING from DB ────────────────────────────────────────────────────
    pricing = []
    for opt in CheckInOption.objects.all().order_by('price_1_year'):
        pricing.append({
            "service": opt.label,
            "y1": f"{float(opt.price_1_year):.2f}",
            "y2": f"{float(opt.price_2_years):.2f}",
            "y3": f"{float(opt.price_3_years):.2f}",
            "active": True,
        })
    if not pricing:
        pricing = [
            {"service": "Check-in \u2014 Daily", "y1": "995.00", "y2": "1,795.00", "y3": "2,595.00", "active": True},
            {"service": "Check-in \u2014 Weekly", "y1": "595.00", "y2": "1,095.00", "y3": "1,595.00", "active": True},
            {"service": "Check-in \u2014 Monthly", "y1": "395.00", "y2": "745.00", "y3": "1,095.00", "active": True},
        ]

    # ── 8. ADD-ONS from DB ────────────────────────────────────────────────────
    addon = []
    for a in AddOnOption.objects.all():
        addon.append({
            "service": a.label,
            "yearly": f"{float(a.price):.2f}",
            "active": True,
        })
    if not addon:
        addon = [
            {"service": "Custom Domain Email Address", "yearly": "39.00", "active": True},
            {"service": "Two-Factor Authentication (2FA)", "yearly": "39.00", "active": True},
        ]

    # ── 9. PRESS ─────────────────────────────────────────────────────────────
    press = [
        {"service": "Press Release \u2014 250 Media", "price": "249.00", "active": True},
    ]

    # ── 10. SERVERS ──────────────────────────────────────────────────────────
    servers = [
        {"name": "login", "role": "Web", "ip": "216.126.194.123", "url": "iwaskilledforthisinformation.one", "active": True}
    ]

    # ── 11. ADMIN USERS ───────────────────────────────────────────────────────
    admin_users = []
    for u in User.objects.filter(is_staff=True).order_by('email'):
        admin_users.append({
            "name": u.get_full_name() or u.username or u.email.split('@')[0],
            "email": u.email,
            "role": "Super Admin" if u.is_superuser else "Admin",
            "lastLogin": u.last_login.strftime("%m/%d/%Y %H:%M") if u.last_login else "Never",
            "active": u.is_active,
        })

    # ── 12. DASHBOARD DETAILS (drill-down tables) ─────────────────────────────
    # Checkins today detail
    checkins_today_rows = []
    for r in CheckInHistoryRecord.objects.filter(created_at__date=today).select_related('user').order_by('-created_at')[:50]:
        sched = getattr(r.user, 'checkin_schedule_config', None)
        freq = "—"
        if sched and sched.purchased_plan:
            plan = sched.purchased_plan.lower()
            if "daily" in plan: freq = "Daily"
            elif "weekly" in plan: freq = "Weekly"
            elif "monthly" in plan: freq = "Monthly"
        checkins_today_rows.append([
            r.user.email,
            freq,
            r.time or "—",
            "Completed",
            "—",
            sched.renewal_date if sched else "—",
        ])

    # Users detail
    users_detail_rows = []
    for u in User.objects.select_related('checkin_schedule_config').order_by('email')[:100]:
        sched = getattr(u, 'checkin_schedule_config', None)
        freq = "Weekly"
        if sched and sched.purchased_plan:
            plan = sched.purchased_plan.lower()
            if "daily" in plan: freq = "Daily"
            elif "monthly" in plan: freq = "Monthly"
            elif "yearly" in plan: freq = "Yearly"
        is_paused = sched.paused if sched else False
        status = "Paused" if is_paused else ("Active" if u.is_active else "Inactive")
        users_detail_rows.append([
            u.email,
            freq,
            sched.renewal_date if sched else "—",
            status,
        ])

    dashboard_details = {
        "checkinsToday": {
            "title": "Check-ins Today",
            "filterColumns": ["Status"],
            "columns": ["Email Address", "Frequency", "Check-in Time", "Status", "Last Email Sent", "Next Check-in"],
            "rows": checkins_today_rows,
        },
        "missedCheckins": {
            "title": "Missed Check-ins Yesterday",
            "filterColumns": ["Status"],
            "columns": ["Email Address", "Frequency", "Status"],
            "rows": [],
        },
        "newClients": {
            "title": "New Clients Today",
            "filterColumns": [],
            "columns": ["Email Address", "Frequency", "Renewal Date", "Status"],
            "rows": users_detail_rows,
        },
        "revenueToday": {
            "title": "Revenue Today",
            "filterColumns": [],
            "columns": ["Invoice", "Date", "Email", "Amount"],
            "rows": [[
                f"26-{str(b.id).zfill(5)}", b.date, b.user.email if b.user else "—", f"${_safe_float(b.amount):,.2f}"
            ] for b in BillingRecord.objects.select_related('user').order_by('-id')[:20]],
        },
        "revenueWeek": {
            "title": "Revenue This Week",
            "filterColumns": [],
            "columns": ["Invoice", "Date", "Email", "Amount"],
            "rows": [[
                f"26-{str(b.id).zfill(5)}", b.date, b.user.email if b.user else "—", f"${_safe_float(b.amount):,.2f}"
            ] for b in BillingRecord.objects.select_related('user').order_by('-id')[:50]],
        },
        "revenueMonth": {
            "title": "Revenue This Month",
            "filterColumns": [],
            "columns": ["Invoice", "Date", "Email", "Amount"],
            "rows": [[
                f"26-{str(b.id).zfill(5)}", b.date, b.user.email if b.user else "—", f"${_safe_float(b.amount):,.2f}"
            ] for b in BillingRecord.objects.select_related('user').order_by('-id')[:100]],
        },
        "expires90": {"title": "Expires in 90 Days", "filterColumns": [], "columns": ["Email", "Frequency", "Renewal Date"], "rows": []},
        "expires60": {"title": "Expires in 60 Days", "filterColumns": [], "columns": ["Email", "Frequency", "Renewal Date"], "rows": []},
        "expires30": {"title": "Expires in 30 Days", "filterColumns": [], "columns": ["Email", "Frequency", "Renewal Date"], "rows": []},
        "expires15": {"title": "Expires in 14 Days", "filterColumns": [], "columns": ["Email", "Frequency", "Renewal Date"], "rows": []},
        "expires5": {"title": "Expires in 5 Days", "filterColumns": [], "columns": ["Email", "Frequency", "Renewal Date"], "rows": []},
        "expires1": {"title": "Expires in 1 Day", "filterColumns": [], "columns": ["Email", "Frequency", "Renewal Date"], "rows": []},
    }

    # Fill expiry details
    for s in CheckInScheduleConfig.objects.select_related('user').all():
        try:
            from datetime import datetime as dt
            rd = dt.strptime(s.renewal_date, "%m/%d/%Y").date()
            diff = (rd - today).days
            freq = "Weekly"
            plan = s.purchased_plan.lower() if s.purchased_plan else ""
            if "daily" in plan: freq = "Daily"
            elif "monthly" in plan: freq = "Monthly"
            elif "yearly" in plan: freq = "Yearly"
            row = [s.user.email, freq, s.renewal_date]
            if 0 <= diff <= 90:
                dashboard_details["expires90"]["rows"].append(row)
            if 0 <= diff <= 60:
                dashboard_details["expires60"]["rows"].append(row)
            if 0 <= diff <= 30:
                dashboard_details["expires30"]["rows"].append(row)
            if 0 <= diff <= 14:
                dashboard_details["expires15"]["rows"].append(row)
            if 0 <= diff <= 5:
                dashboard_details["expires5"]["rows"].append(row)
            if 0 <= diff <= 1:
                dashboard_details["expires1"]["rows"].append(row)
        except Exception:
            pass

    return {
        "users": users,
        "orders": orders,
        "stat_cards": stat_cards,
        "expiry_cards": expiry_cards,
        "pricing": pricing,
        "addon": addon,
        "press": press,
        "servers": servers,
        "admin_users": admin_users,
        "dashboard_details": dashboard_details,
    }


class CustomAdminDashboardView(UserPassesTestMixin, TemplateView):
    template_name = "dashboard/custom_admin.html"
    login_url = "/admin/login/"

    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.is_staff

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        data = _build_admin_data()

        context["users_json"] = json.dumps(data["users"], default=str)
        context["names_json"] = "[]"
        context["accounting_orders_json"] = json.dumps(data["orders"], default=str)
        context["stat_cards_json"] = json.dumps(data["stat_cards"], default=str)
        context["expiry_cards_json"] = json.dumps(data["expiry_cards"], default=str)
        context["pricing_json"] = json.dumps(data["pricing"], default=str)
        context["addon_json"] = json.dumps(data["addon"], default=str)
        context["press_json"] = json.dumps(data["press"], default=str)
        context["outbound_messages_json"] = json.dumps([], default=str)
        context["servers_json"] = json.dumps(data["servers"], default=str)
        context["private_email_json"] = json.dumps([], default=str)
        context["two_factor_json"] = json.dumps([], default=str)
        context["admin_users_json"] = json.dumps(data["admin_users"], default=str)
        context["email_sending_json"] = json.dumps([], default=str)
        context["dashboard_details_json"] = json.dumps(data["dashboard_details"], default=str)
        return context


class AdminDataApiView(View):
    """
    Real-time JSON API endpoint for the admin dashboard.
    Called every 30 seconds by the frontend to refresh data.
    """
    def get(self, request, *args, **kwargs):
        if not (request.user.is_authenticated and request.user.is_staff):
            return JsonResponse({"error": "Unauthorized"}, status=401)
        try:
            data = _build_admin_data()
            return JsonResponse({
                "users": data["users"],
                "accounting_orders": data["orders"],
                "stat_cards": data["stat_cards"],
                "expiry_cards": data["expiry_cards"],
                "pricing": data["pricing"],
                "addon": data["addon"],
                "press": data["press"],
                "servers": data["servers"],
                "admin_users": data["admin_users"],
                "dashboard_details": data["dashboard_details"],
                "timestamp": timezone.now().isoformat(),
            }, safe=False, json_dumps_params={"default": str})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


import re
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

@method_decorator(csrf_exempt, name='dispatch')
class AdminSaveDataApiView(View):
    """
    Handles saving data from the admin dashboard (Pricing, Add-ons, Press).
    """
    def post(self, request, *args, **kwargs):
        if not (request.user.is_authenticated and request.user.is_staff):
            return JsonResponse({"error": "Unauthorized"}, status=401)
            
        try:
            payload = json.loads(request.body)
            key = payload.get("key")
            data = payload.get("data", [])
            
            if key == "pricing":
                from apps.payments.models import CheckInOption
                CheckInOption.objects.all().delete()
                for item in data:
                    # Ignore if toggled off
                    if not item.get("active", True):
                        continue
                        
                    label = item.get("service", "Unknown Plan")
                    slug_key = re.sub(r'[^a-z0-9]+', '_', label.lower()).strip('_')
                    if not slug_key: slug_key = "plan"
                    
                    try: y1 = float(item.get("y1", 0) or 0)
                    except: y1 = 0
                    try: y2 = float(item.get("y2", 0) or 0)
                    except: y2 = 0
                    try: y3 = float(item.get("y3", 0) or 0)
                    except: y3 = 0
                    
                    price_per_month = y1 / 12 if y1 else 0
                    
                    display_label = label.split("\u2014")[-1].strip() if "\u2014" in label else label
                    
                    CheckInOption.objects.create(
                        key=slug_key,
                        label=label,
                        display_label=display_label,
                        price_per_month=price_per_month,
                        price_1_year=y1,
                        price_2_years=y2,
                        price_3_years=y3
                    )
                return JsonResponse({"success": True})
                
            elif key == "addon":
                from apps.payments.models import AddOnOption
                AddOnOption.objects.all().delete()
                for item in data:
                    if not item.get("active", True):
                        continue
                        
                    label = item.get("service", "Unknown Addon")
                    slug_key = re.sub(r'[^a-z0-9]+', '_', label.lower()).strip('_')
                    if not slug_key: slug_key = "addon"
                    
                    try: price = float(item.get("yearly", 0) or 0)
                    except: price = 0
                    
                    AddOnOption.objects.create(
                        key=slug_key,
                        label=label,
                        price=price
                    )
                return JsonResponse({"success": True})
                
            elif key == "press":
                from apps.dashboard.models import PressReleaseTier
                PressReleaseTier.objects.all().delete()
                tier_idx = 0
                for item in data:
                    if not item.get("active", True):
                        continue
                        
                    label = item.get("service", "Press Release")
                    try: price = float(item.get("price", 0) or 0)
                    except: price = 0
                    
                    # Try to extract count from label like "Press Release — 250 Media"
                    count = "100"
                    m = re.search(r'(\d+)', label)
                    if m:
                        count = m.group(1)
                        
                    PressReleaseTier.objects.create(
                        tier_index=tier_idx,
                        count=count,
                        label=label,
                        price=price
                    )
                    tier_idx += 1
                return JsonResponse({"success": True})
                
            else:
                return JsonResponse({"error": "Unknown key"}, status=400)
                
        except Exception as e:
            import traceback
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)


class AdminLogoutView(View):
    """Logs out the admin user and redirects to login."""
    def post(self, request, *args, **kwargs):
        logout(request)
        return JsonResponse({"success": True, "redirect": "/admin/login/"})

    def get(self, request, *args, **kwargs):
        logout(request)
        from django.shortcuts import redirect
        return redirect("/admin/login/")
