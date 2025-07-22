import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import React, { useState, useRef, useEffect } from "react"; // Imported useEffect
import { fetchUserBySecretKey } from "../api"; 
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { motion } from 'framer-motion';
import { LockClosedIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const navigate = useNavigate();
  const { register, setValue, formState: { errors } } = useForm();
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef();


  const handleInputChange = async (e) => {
    const value = e.target.value.replace(/\D/g, "");
    setValue("secretKey", value);

    if (value.length === 6) {
      setLoginError("");
      setLoading(true);
      try {
        const user = await fetchUserBySecretKey(value);

        if (!user || !user.user_type) {
          setLoginError("Invalid secret key or user data not found.");
          setValue("secretKey", "");
          if(inputRef.current) {
            inputRef.current.value = "";
          }
          setLoading(false);
          return;
        }

        localStorage.clear();
        localStorage.setItem("userName", user.fields["User Name"] || "User");
        localStorage.setItem("secretKey", value);
        localStorage.setItem("userRecordId", user.id);
        localStorage.setItem("accountIds", JSON.stringify(user.fields.Accounts || []));
        localStorage.setItem("projectIds", JSON.stringify(user.fields.Projects || []));
        localStorage.setItem("updateIds", JSON.stringify(user.fields.Updates || []));
        localStorage.setItem("taskIds", JSON.stringify(user.fields["Tasks (Assigned To)"] || []));
        localStorage.setItem("createdTaskIds", JSON.stringify(user.fields["Tasks (Created By)"] || []));
        
        setLoading(false);

        if (user.user_type === 'admin') {
          localStorage.setItem("isAdmin", "true");
          navigate("/admin/dashboard");
        } else {
          localStorage.setItem("isAdmin", "false");
          navigate("/");
        }

      } catch (err) {
        console.error("Authentication failed:", err);
        setLoginError("Authentication failed. Please check your key and try again.");
        setValue("secretKey", "");
        if(inputRef.current) {
            inputRef.current.value = "";
        }
        setLoading(false);
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-[80vh] flex items-center justify-center bg-card px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8 p-10 bg-[#333333] rounded-2xl border border-border"
        >
          <div className="flex flex-col items-center space-y-4">
            <div className="p-3 bg-secondary rounded-full border border-border">
                <LockClosedIcon className="h-8 w-8 text-foreground" />
            </div>
            <h2 className="text-4xl font-light text-center text-foreground">
              Sign in to your account
            </h2>
            <p className="text-base text-muted-foreground text-center max-w-xs leading-relaxed">
              Enter your 6-digit secret key to continue
            </p>
          </div>
          <form className="space-y-6 w-full" autoComplete="off" onSubmit={e => e.preventDefault()}>
            <div>
              <label htmlFor="secretKey" className="sr-only">
                Secret Key
              </label>
              <input
                id="secretKey"
                {...register("secretKey", {
                  required: "Secret key is required",
                  minLength: { value: 6, message: "Key must be 6 digits" },
                  maxLength: { value: 6, message: "Key must be 6 digits" },
                  pattern: { value: /^\d{6}$/, message: "Key must be 6 digits" },
                })}
                type="password"
                placeholder="● ● ● ● ● ●"
                className="block w-full rounded-md border-border bg-secondary shadow-sm focus:border-primary focus:ring-primary text-foreground placeholder:text-muted-foreground py-4 px-5 text-center tracking-[1.5em] text-2xl font-mono placeholder:tracking-normal"
                disabled={loading}
                autoFocus
                maxLength={6}
                ref={inputRef}
                onChange={handleInputChange}
                inputMode="numeric"
                pattern="\d*"
                spellCheck="false"
              />
              {errors.secretKey && (
                <span className="text-red-500 text-sm mt-2 block text-center">{errors.secretKey.message}</span>
              )}
            </div>
          </form>
          {loginError && (
            <div className="text-red-500 text-center text-sm font-medium">{loginError}</div>
          )}
          {loading && (
            <div className="flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            </div>
          )}
          <div className="text-center">
            <p className="text-xs text-muted-foreground mt-6 max-w-xs mx-auto leading-relaxed">
              Ask your administrator for your key.
            </p>
            <p className="text-xs text-yellow-500/80 mt-2 font-medium max-w-xs mx-auto leading-relaxed">
              Please <span className="underline">do not share</span> your secret key with anyone.
            </p>
          </div>
        </motion.div>
      </div>
      <Footer />
    </>
  );
}
