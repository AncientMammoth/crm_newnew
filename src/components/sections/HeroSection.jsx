import React from 'react';
import { motion } from 'framer-motion'; // <-- THIS IS THE FIX
import { ShineBorder } from "../ui/ShineBorder";
import { Button } from "../ui/button";

export default function HeroSection() {
  return (
    <section className="w-full max-w-[1532px] text-white mx-auto flex flex-col items-center justify-center px-4 lg:px-8 py-6 lg:py-12 text-center relative">
      {/* Main Heading */}
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="font-light text-3xl lg:text-[80px] leading-tight mb-6 md:mb-8"
      >
        Customer Relationship
        <br className="hidden md:block" />
        Management, Reimagined
      </motion.h1>

      {/* Subtitle */}
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="text-base lg:text-2xl font-light mb-8 md:mb-12 text-muted-foreground"
      >
        Blending cutting-edge style with your powerful CRM logic. Welcome to the new look.
      </motion.p>
      
      {/* CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mb-12 md:mb-20"
      >
        <Button size="lg">Get Started</Button>
      </motion.div>

      {/* "What Fuels Us" Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="relative w-full mx-auto mt-4"
      >
        <div className="relative rounded-2xl lg:rounded-[24px] border border-border bg-secondary/60 px-4 lg:px-12 py-8 lg:py-16 text-white overflow-hidden">
          <ShineBorder borderWidth={1} duration={14} shineColor={["#FD184A", "#4AFDF1", "#F1FA38"]} />
          <h2 className="text-2xl lg:text-4xl font-light mb-6">Your Central Hub</h2>
          <p className="text-sm lg:text-lg text-muted-foreground font-light ">
            This is where your dashboard content will live, presented in a beautiful and intuitive new interface. All your data and functionality are preserved, just presented in a more engaging way.
          </p>
        </div>
      </motion.div>
    </section>
  );
}