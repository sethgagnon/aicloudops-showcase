import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/integrations/supabase/client'

// Generate or get session ID from cookie
const getSessionId = () => {
  const cookieName = 'analytics_session_id'
  const existingCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${cookieName}=`))
  
  if (existingCookie) {
    return existingCookie.split('=')[1]
  }
  
  // Generate new session ID
  const sessionId = crypto.randomUUID()
  // Set cookie for 30 days
  const expires = new Date()
  expires.setDate(expires.getDate() + 30)
  document.cookie = `${cookieName}=${sessionId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`
  
  return sessionId
}

// Parse UTM parameters from URL
const getUTMParams = (search: string) => {
  const params = new URLSearchParams(search)
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  }
}

export const useAnalytics = () => {
  const location = useLocation()
  const sessionId = useRef<string>()
  const lastTrackedPath = useRef<string>()
  
  useEffect(() => {
    // Initialize session ID
    if (!sessionId.current) {
      sessionId.current = getSessionId()
    }
    
    // Avoid tracking the same path multiple times
    if (lastTrackedPath.current === location.pathname) {
      return
    }
    
    // Track page view
    const trackPageView = async () => {
      try {
        const utmParams = getUTMParams(location.search)
        
        await supabase.functions.invoke('track-analytics', {
          body: {
            path: location.pathname,
            title: document.title,
            session_id: sessionId.current,
            ...utmParams,
          },
        })
        
        lastTrackedPath.current = location.pathname
      } catch (error) {
        // Silently fail - don't break the app for analytics
        console.warn('Analytics tracking failed:', error)
      }
    }
    
    // Use requestIdleCallback to defer analytics tracking and avoid blocking critical resources
    const scheduleTracking = () => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => trackPageView(), { timeout: 1000 });
      } else {
        // Fallback with longer delay for non-supporting browsers
        setTimeout(trackPageView, 500);
      }
    };
    
    scheduleTracking()
    
    return () => {
      // No cleanup needed for requestIdleCallback
    }
  }, [location])
  
  // Track custom events
  const trackEvent = async (eventName: string, meta: Record<string, any> = {}) => {
    try {
      await supabase.functions.invoke('track-analytics-event', {
        body: {
          event_name: eventName,
          path: location.pathname,
          session_id: sessionId.current,
          meta,
        },
      })
    } catch (error) {
      console.warn('Event tracking failed:', error)
    }
  }
  
  return { trackEvent }
}