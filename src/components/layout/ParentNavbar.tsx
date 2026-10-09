"use client";

import React from "react";
import { ParentHeader } from "./ParentHeader";

interface ParentNavbarProps {
  schoolName?: string;
  schoolLogo?: string | null;
  childName?: string;
  childClass?: string;
  cartCount?: number;
  onOpenAddChild?: () => void;
  selectedStudent?: any;
  students?: any[];
  onSelectStudent?: (student: any) => void;
}

export const ParentNavbar: React.FC<ParentNavbarProps> = ({
  schoolName,
  childName,
  childClass,
  cartCount,
  onOpenAddChild,
  selectedStudent,
  students = [],
  onSelectStudent,
}) => {
  const currentStudent = selectedStudent || (childName ? { name: childName, class: childClass || "" } : null);

  return (
    <ParentHeader
      selectedStudent={currentStudent}
      students={students}
      onSelectStudent={onSelectStudent}
      onAddChild={onOpenAddChild}
      cartCount={cartCount}
      activeSchoolName={schoolName}
    />
  );
};

