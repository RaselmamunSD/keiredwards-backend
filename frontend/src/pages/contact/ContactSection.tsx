"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// ── Validation Schema ──────────────────────────────────────────────────────
const contactSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  isCustomer: z.string().min(1, "Please select an option"),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

type ContactFormData = z.infer<typeof contactSchema>;

// ── Field Error Component ──────────────────────────────────────────────────
const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="text-[#EF3832] text-sm">{message}</p> : null;

// ── Input Class Helper ─────────────────────────────────────────────────────
const inputClass = (hasError: boolean) =>
  `w-full bg-[#0d1117] text-white text-base px-5 py-4 border rounded-sm 
   placeholder-white/30 focus:outline-none transition-colors duration-200
   ${hasError
    ? "border-[#EF3832] focus:border-[#EF3832]"
    : "border-white/20 focus:border-white/50"
  }`;

// ── Main Contact Page ──────────────────────────────────────────────────────
const ContactSection = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data: ContactFormData) => {
    // TODO: Replace with your email API / service (e.g. EmailJS, SendGrid, Resend)
    // Target email: contact@yourcompany.com
    console.log("Contact Form Submitted:", data);
    setIsSubmitted(true);
    reset();
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  return (
    <section className="w-full sm:py-20 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <p className="text-xs tracking-[0.3em] text-[#EF3832] uppercase font-semibold mb-3">
            Get In Touch
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white uppercase tracking-tight mb-4">
            Contact Us
          </h1>
          <p className="text-white/60 text-base leading-relaxed">
            Have a question or need assistance? Fill out the form below and
            we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        {/* ── Success Message ── */}
        {isSubmitted && (
          <div className="border border-green-500/40 bg-green-500/10 rounded-sm px-5 py-4 mb-8">
            <p className="text-green-400 font-medium text-sm">
              ✓ Your message has been sent successfully. We&apos;ll be in touch soon.
            </p>
          </div>
        )}

        {/* ── Form ── */}
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">

          {/* Full Name */}
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">
              Full Name <span className="text-[#EF3832]">*</span>
            </label>
            <input
              {...register("fullName")}
              type="text"
              placeholder="Enter your full name"
              className={inputClass(!!errors.fullName)}
            />
            <FieldError message={errors.fullName?.message} />
          </div>

          {/* Email Address */}
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">
              Email Address <span className="text-[#EF3832]">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="Enter your email address"
              className={inputClass(!!errors.email)}
            />
            <FieldError message={errors.email?.message} />
          </div>

          {/* Subject */}
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">
              Subject <span className="text-[#EF3832]">*</span>
            </label>
            <input
              {...register("subject")}
              type="text"
              placeholder="What is this regarding?"
              className={inputClass(!!errors.subject)}
            />
            <FieldError message={errors.subject?.message} />
          </div>

          {/* Are you currently a customer of IWK? */}
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">
              Are you currently a customer of IWK? <span className="text-[#EF3832]">*</span>
            </label>
            <div className="relative">
              <select
                {...register("isCustomer")}
                className={`${inputClass(!!errors.isCustomer)} appearance-none cursor-pointer pr-12`}
                defaultValue=""
              >
                <option value="" disabled className="text-white/30 bg-[#0d1117]">
                  Select an option
                </option>
                <option value="yes" className="bg-[#0d1117] text-white">Yes</option>
                <option value="no" className="bg-[#0d1117] text-white">No</option>
                {/* <option value="not_sure" className="bg-[#0d1117] text-white">Not sure</option> */}
              </select>
              {/* Down Arrow Icon */}
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <svg
                  className="w-4 h-4 text-white/50"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>
            <FieldError message={errors.isCustomer?.message} />
          </div>

          {/* Message */}
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">
              Message <span className="text-[#EF3832]">*</span>
            </label>
            <textarea
              {...register("message")}
              rows={6}
              placeholder="Write your message here..."
              className={`${inputClass(!!errors.message)} resize-none`}
            />
            <FieldError message={errors.message?.message} />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto flex rounded items-center cursor-pointer justify-center gap-2 bg-[#EF3832] hover:bg-red-600 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm tracking-widest uppercase px-10 py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Sending...
                </>
              ) : (
                "Send Message"
              )}
            </button>
          </div>

        </form>
      </div>
    </section>
  );
};

export default ContactSection;