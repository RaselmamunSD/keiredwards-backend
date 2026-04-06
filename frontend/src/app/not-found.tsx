'use client'
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
    const router = useRouter()

    const handleBack = ()=>{
        router.back()
    }
    
  return (
    <div>
      <section className="bg-white ">
        <div className="container min-h-screen px-6 py-12 mx-auto lg:flex lg:items-center lg:gap-12">
          <div className="wf-ull lg:w-1/2">
            <p className="text-sm font-medium text-gray-500">404 error</p>

            <h1 className="mt-3 text-2xl md:text-3xl font-semibold bg-gradient-to-r from-gray-500 via-blue-500 to-gray-700 bg-clip-text text-transparent">
              Page not found
            </h1>

            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Sorry, right now this page is not available!
            </p>

            <div className="flex items-center mt-6 gap-x-3">
              <button onClick={handleBack} className="flex items-center justify-center w-1/2 px-5 py-2 text-sm text-gray-700 transition-colors duration-200 bg-white border rounded-lg gap-x-2 sm:w-auto hover:bg-gray-100 ">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-5 h-5 rtl:rotate-180"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18"
                  />
                </svg>

                <span>Go back</span>
              </button>

              <Link
                href={"/"}
                className="w-1/2 px-5 py-2 text-sm tracking-wide text-white transition-colors duration-200 bg-gray-500 rounded-lg shrink-0 sm:w-auto hover:bg-gray-600"
              >
                Let&apos;s go home
              </Link>
            </div>
          </div>

          <div className="relative w-full mt-8 lg:w-1/2 lg:mt-0">
            <Image
              className=" w-full lg:h-[32rem] h-80 md:h-96 rounded-lg object-cover "
              src="/NotFoundPage/404.jpg"
              alt="404_Page"
              width={600}
              height={600}
            />
          </div>
        </div>
      </section>
    </div>
  );
}