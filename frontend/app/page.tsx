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
    <div className="size-full bg-background flex flex-col">
      <div className="flex justify-center items-center gap-x-8 pt-8">
        <div className="flex flex-col items-center w-1/3">
          <h1 className="text-9xl font-bold hero-foreground">XAMS</h1>
          <span className={`${cherryBomb.variable} font-bold text-2xl`}>きょういくざむす</span>
          <div className="mt-8 p-8 border-l-4 border-primary bg-black/20 cursor-pointer transition duration-500 hover:text-primary hover:-translate-y-5">
            <p className="indent-8">Our <span className="text-highlight">website</span> offers an intuitive and efficient platform for managing <span className="text-highlight">exams</span> and <span className="text-highlight">assignments</span>, providing educators and students with all the tools they need for seamless academic engagement. Instructors can <span className="text-highlight">easily</span> create, schedule, and grade exams, set clear guidelines for assignments, and monitor student progress.</p>
          </div>
        </div>
        <div className="w-1/3 ">
          <Image src={illustrationImage} width={500} height={500} alt="illustration" />
        </div>
      </div>
      <div className="flex gap-x-4 justify-center items-center">
          <Button as={Link} href="/explore" className="text-primary" variant="flat" color="primary" size="lg">Explore Our Courses</Button>
          <Button as={Link} href="/member/sign-up" className=" font-bold" color="secondary" size="lg">Become our member</Button>
      </div>
    </div>
  );
}
