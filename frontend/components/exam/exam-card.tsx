"use client";

import React from "react";
import { Card } from "@nextui-org/react";
import Link from "next/link";
import { MingcuteFileTextFill } from "../icons/icons";

type Props = {
  id: string;
  title: string;
  description?: string;
  className?: string;
};

const ExamCard = ({ id, title, description, className }: Props) => {
  return (
    <Link href={`/overview/@teacher/examination/${id}`}>
      <div className="flex justify-center items-center h-[80px]">
        <MingcuteFileTextFill width={100} height={100} className="text-blue-500" />
      </div>
      <div className="flex flex-col items-center text-center mt-2">
        <p className="text-sm font-medium truncate w-full">{title}</p>
        {description && (
          <p className="text-xs text-gray-500 truncate w-full">{description}</p>
        )}
      </div>
    </Link>
  );
};

export default ExamCard;
