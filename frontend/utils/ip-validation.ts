/**
 * IP validation utility for exam access control
 */

/**
 * Get client IP address using multiple methods
 */
export const getClientIP = async (): Promise<string | null> => {
  try {
    // Try multiple IP detection services
    const ipServices = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://api.ip.sb/jsonip'
    ]

    for (const service of ipServices) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        
        const response = await fetch(service, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          const ip = data.ip || data.query
          if (ip) {
            console.log(`Client IP detected: ${ip} (via ${service})`)
            return ip
          }
        }
      } catch (error) {
        console.warn(`Failed to get IP from ${service}:`, error)
        continue
      }
    }

    // Fallback: try to get IP from request headers if available
    if (typeof window !== 'undefined' && (window as any).clientIP) {
      return (window as any).clientIP
    }

    return null
  } catch (error) {
    console.error('Error getting client IP:', error)
    return null
  }
}

/**
 * Parse IP range string into individual IPs and CIDR blocks
 */
export const parseIPRange = (ipRange: string): string[] => {
  if (!ipRange || ipRange.trim() === '') {
    return []
  }

  return ipRange
    .split(',')
    .map(ip => ip.trim())
    .filter(ip => ip.length > 0)
}

/**
 * Check if an IP address is in CIDR notation range
 */
export const isIPInCIDR = (ip: string, cidr: string): boolean => {
  try {
    // Parse CIDR notation (e.g., "192.168.1.0/24")
    const [network, prefixLength] = cidr.split('/')
    
    if (!prefixLength) {
      // If no prefix length, treat as exact IP match
      return ip === network
    }

    const prefix = parseInt(prefixLength, 10)
    if (prefix < 0 || prefix > 32) {
      return false
    }

    // Convert IP addresses to 32-bit integers
    const ipToInt = (ipAddr: string): number => {
      return ipAddr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    }

    const ipInt = ipToInt(ip)
    const networkInt = ipToInt(network)
    
    // Create subnet mask
    const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0
    
    // Check if IP is in the network
    return (ipInt & mask) === (networkInt & mask)
  } catch (error) {
    console.error('Error checking IP in CIDR:', error)
    return false
  }
}

/**
 * Check if an IP address matches any of the allowed IP ranges
 */
export const isIPAllowed = (clientIP: string, allowedRanges: string[]): boolean => {
  if (!clientIP || allowedRanges.length === 0) {
    return true // If no IP restrictions, allow all
  }

  for (const range of allowedRanges) {
    // Check for exact IP match
    if (clientIP === range) {
      return true
    }

    // Check for CIDR range match
    if (range.includes('/')) {
      if (isIPInCIDR(clientIP, range)) {
        return true
      }
    }

    // Check for wildcard patterns (e.g., "192.168.1.*")
    if (range.includes('*')) {
      const pattern = range.replace(/\*/g, '\\d+')
      const regex = new RegExp(`^${pattern}$`)
      if (regex.test(clientIP)) {
        return true
      }
    }

    // Check for IP range (e.g., "192.168.1.1-192.168.1.100")
    if (range.includes('-')) {
      const [startIP, endIP] = range.split('-').map(ip => ip.trim())
      if (isIPInRange(clientIP, startIP, endIP)) {
        return true
      }
    }
  }

  return false
}

/**
 * Check if an IP is within a range (start-end format)
 */
export const isIPInRange = (ip: string, startIP: string, endIP: string): boolean => {
  try {
    const ipToInt = (ipAddr: string): number => {
      return ipAddr.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0
    }

    const ipInt = ipToInt(ip)
    const startInt = ipToInt(startIP)
    const endInt = ipToInt(endIP)

    return ipInt >= startInt && ipInt <= endInt
  } catch (error) {
    console.error('Error checking IP range:', error)
    return false
  }
}

/**
 * Validate IP address format
 */
export const isValidIPAddress = (ip: string): boolean => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipRegex.test(ip)
}

/**
 * Get user-friendly error messages for IP blocking
 */
export const getIPBlockMessage = (clientIP: string | null, allowedRanges: string[]): string => {
  if (!clientIP) {
    return 'Unable to determine your IP address. Please check your network connection and try again.'
  }

  if (allowedRanges.length === 0) {
    return 'No IP restrictions are configured for this exam.'
  }

  return `Access denied. Your IP address (${clientIP}) is not in the allowed range for this exam. Allowed ranges: ${allowedRanges.join(', ')}`
}
