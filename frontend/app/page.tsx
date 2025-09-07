import localFont from "next/font/local";
import illustrationImage from '@/public/images/3dillustrator.png'
import Image from "next/image";
import { Button, Link } from "@nextui-org/react";

const cherryBomb = localFont({
  src: "./fonts/CherryBombOne-Regular.ttf",
  variable: "--cherry-bomb-one",
  weight: "400"
})

export default function Home() {
  return (
    <div className="bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-x-8 px-4 sm:px-6 lg:px-8 pt-8 lg:pt-16">
        {/* Text Content */}
        <div className="flex flex-col items-center lg:w-1/2 xl:w-1/3 order-2 lg:order-1">
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold hero-foreground text-center">
            XAMS
          </h1>
          <span className={`${cherryBomb.variable} font-bold text-lg sm:text-xl md:text-2xl text-center mt-2`}>
            きょういくざむす
          </span>
          <div className="mt-6 sm:mt-8 p-4 sm:p-6 lg:p-8 border-l-4 border-primary bg-black/20 cursor-pointer transition duration-500 hover:text-primary hover:-translate-y-2 lg:hover:-translate-y-5 max-w-lg lg:max-w-none">
            <p className="text-sm sm:text-base indent-4 sm:indent-8 leading-relaxed">
              Our <span className="text-highlight">website</span> offers an intuitive and efficient platform for managing <span className="text-highlight">exams</span> and <span className="text-highlight">assignments</span>, providing educators and learners with all the tools they need for seamless academic engagement. Instructors can <span className="text-highlight">easily</span> create, schedule, and grade exams, set clear guidelines for assignments, and monitor learner progress.
            </p>
          </div>
        </div>
        
        {/* Image */}
        <div className="lg:w-1/2 xl:w-1/3 order-1 lg:order-2 flex justify-center">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px]">
            <Image 
              src={illustrationImage} 
              fill
              className="object-contain"
              alt="illustration" 
              priority
            />
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-x-4 justify-center items-center px-4 pb-8 lg:pb-16">
        <Button 
          as={Link} 
          href="/explore" 
          className="text-primary w-full sm:w-auto" 
          variant="flat" 
          color="primary" 
          size="lg"
        >
          Explore Our Courses
        </Button>
        <Button 
          as={Link} 
          href="/member/sign-up" 
          className="font-bold w-full sm:w-auto" 
          color="secondary" 
          size="lg"
        >
          Become our member
        </Button>
      </div>
    </div>
  );
}
