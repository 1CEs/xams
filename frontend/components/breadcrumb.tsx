"use client"

import { Breadcrumbs, BreadcrumbItem } from "@nextui-org/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useMemo } from "react"

const Breadcrumb = () => {
  const pathname = usePathname()
  
  const breadcrumbItems = useMemo(() => {
    // Skip the first empty string from the split
    const pathSegments = pathname.split('/').filter(segment => segment !== '')
    
    // Create breadcrumb items with proper links
    return pathSegments.map((segment, index) => {
      // Create the href for this breadcrumb item
      const href = '/' + pathSegments.slice(0, index + 1).join('/')
      
      // Format the segment for display (capitalize, replace hyphens with spaces)
      const formattedSegment = segment
        .replace(/-/g, ' ')
        .replace(/^\w/, c => c.toUpperCase())
        
      return {
        label: formattedSegment,
        href,
        // Special case for @teacher and @student segments which are parallel routes
        isParallelRoute: segment.startsWith('@')
      }
    })
  }, [pathname])
  
  // If we're at the root or have no breadcrumb items, don't render
  if (breadcrumbItems.length === 0) {
    return null
  }
  
  return (
    <div className="py-4">
      <Breadcrumbs size="sm">
        <BreadcrumbItem>
          <Link href="/">Home</Link>
        </BreadcrumbItem>
        
        {breadcrumbItems.map((item, index) => (
          <BreadcrumbItem key={index}>
            {/* Don't make parallel routes clickable since they're not real pages */}
            {item.isParallelRoute ? (
              <span>{item.label}</span>
            ) : (
              <Link href={item.href}>{item.label}</Link>
            )}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>
    </div>
  )
}

export default Breadcrumb
