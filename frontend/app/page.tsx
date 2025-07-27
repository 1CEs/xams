import localFont from "next/font/local";
import illustrationImage from '@/public/images/3dillustrator.png'
import Image from "next/image";
import { Button } from "@nextui-org/react";

const cherryBomb = localFont({
  src: "./fonts/CherryBombOne-Regular.ttf",
  variable: "--cherry-bomb-one",
  weight: "400"
})

export default function Home() {
  return (
    <div className="size-full bg-background flex flex-col min-h-screen">
      {/* Main Content Section */}
      <div className="flex-1 flex flex-col lg:flex-row justify-center items-center gap-8 pt-4 sm:pt-8 px-4 sm:px-6 lg:px-8">
        {/* Text Content */}
        <div className="flex flex-col items-center text-center lg:text-left lg:items-start w-full lg:w-1/2 max-w-2xl">
          {/* Title - Responsive text sizes */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold hero-foreground mb-2 sm:mb-4">
            XAMS
          </h1>
          
          {/* Subtitle */}
          <span className={`${cherryBomb.variable} font-bold text-lg sm:text-xl md:text-2xl mb-6 sm:mb-8`}>
            きょういくざむす
          </span>
          
          {/* Description Card */}
          <div className="w-full mt-4 sm:mt-8 p-4 sm:p-6 lg:p-8 border-l-4 border-primary bg-black/20 cursor-pointer transition duration-500 hover:text-primary hover:-translate-y-1 sm:hover:-translate-y-5">
            <p className="text-sm sm:text-base lg:text-lg leading-relaxed indent-4 sm:indent-8">
              Our <span className="text-highlight">website</span> offers an intuitive and efficient platform for managing{" "}
              <span className="text-highlight">exams</span> and <span className="text-highlight">assignments</span>,{" "}
              providing educators and students with all the tools they need for seamless academic engagement.{" "}
              Instructors can <span className="text-highlight">easily</span> create, schedule, and grade exams,{" "}
              set clear guidelines for assignments, and monitor student progress.
            </p>
          </div>
        </div>
        
        {/* Image Section */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end max-w-lg lg:max-w-none">
          <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
            <Image 
              src={illustrationImage} 
              width={500} 
              height={500} 
              alt="illustration" 
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center p-4 sm:p-6 lg:p-8 mt-auto">
        <Button 
          className="text-primary w-full sm:w-auto min-w-[200px]" 
          variant="flat" 
          color="primary" 
          size="lg"
        >
          Explore Our Courses
        </Button>
        <Button 
          className="font-bold w-full sm:w-auto min-w-[200px]" 
          color="secondary" 
          size="lg"
        >
          Become our member
        </Button>
      </div>
    </div>
  );
}
