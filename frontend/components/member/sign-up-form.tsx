"use client";
import React, { useState } from "react";
import Form from "./form";
import { Input, Checkbox, Link } from "@nextui-org/react";
import PasswordInput from "./password-input";
import { isValidPassword } from "@/utils/auth-errors";
import TermsOfServiceModal from "./terms-of-service-modal";

const SignUpForm = () => {
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [passwordMatchError, setPasswordMatchError] = useState<string>("");
  const [isPasswordValid, setIsPasswordValid] = useState<boolean>(false);
  const [isPasswordsMatch, setIsPasswordsMatch] = useState<boolean>(false);
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordMatchError("");

    // Check if password meets the requirements
    setIsPasswordValid(isValidPassword(newPassword));

    // Re-validate confirm password if it exists
    if (confirmPassword && newPassword !== confirmPassword) {
      setPasswordMatchError("Passwords do not match");
      setIsPasswordsMatch(false);
    } else if (confirmPassword && newPassword === confirmPassword) {
      setPasswordMatchError("");
      setIsPasswordsMatch(true);
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);

    if (password && newConfirmPassword !== password) {
      setPasswordMatchError("Passwords do not match");
      setIsPasswordsMatch(false);
    } else if (password && newConfirmPassword === password) {
      setPasswordMatchError("");
      setIsPasswordsMatch(true);
    } else {
      setIsPasswordsMatch(false);
    }
  };

  const handleTermsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      <Form
        content="Sign Up"
        buttonContent="Sign Up"
        className="w-full max-w-md sm:max-w-lg lg:max-w-2xl"
        isSignUp={true}
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            name="first_name"
            size="sm"
            label="First name"
            placeholder="Enter your first name"
            isRequired
            className="flex-1"
          />
          <Input
            name="last_name"
            size="sm"
            label="Last name"
            placeholder="Enter your last name"
            isRequired
            className="flex-1"
          />
        </div>
        <Input
          name="username"
          size="sm"
          label="Username"
          placeholder="Enter your username"
          isRequired
        />
        <Input
          type="email"
          name="email"
          size="sm"
          label="Email"
          placeholder="Example@mail.com"
          isRequired
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <PasswordInput
            size="sm"
            name="password"
            onChange={handlePasswordChange}
            showPasswordHints={true}
            isValid={isPasswordValid}
          />
          <PasswordInput
            size="sm"
            name="confirmPassword"
            label="Confirm password"
            placeholder="Enter your password again"
            onChange={handleConfirmPasswordChange}
            error={passwordMatchError}
            isValid={isPasswordsMatch && !passwordMatchError}
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            color="secondary"
            isSelected={acceptedTerms}
            onValueChange={setAcceptedTerms}
            size="sm"
            classNames={{
              base: "",
              label: "text-small",
            }}
          ></Checkbox>
          <span className="text-sm">
            I agree to the{" "}
            <Link
              href="#"
              onClick={handleTermsClick}
              className="text-blue-500 hover:text-blue-400 cursor-pointer text-sm"
            >
              Terms of Service
            </Link>
          </span>
          <input
            type="hidden"
            name="acceptedTerms"
            value={acceptedTerms ? "true" : ""}
          />
        </div>
      </Form>

      <TermsOfServiceModal isOpen={isModalOpen} onClose={handleModalClose} />
    </>
  );
};

export default SignUpForm;
