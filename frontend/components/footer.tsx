import React from 'react'

type Props = {}

const Footer = (props: Props) => {
  return (
    <footer className="w-full bg-background border-t border-default-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-4 sm:py-6 text-center">
          <p className="text-xs sm:text-sm text-white/50 leading-relaxed">
            Built <span className="hero-foreground font-bold">XAMS</span> with AI
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer