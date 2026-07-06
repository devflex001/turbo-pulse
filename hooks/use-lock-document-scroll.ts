"use client"

import * as React from "react"

export function useLockDocumentScroll() {
  React.useLayoutEffect(() => {
    const html = document.documentElement
    const body = document.body
    const previous = {
      htmlHeight: html.style.height,
      htmlOverflow: html.style.overflow,
      htmlOverscrollBehavior: html.style.overscrollBehavior,
      bodyHeight: body.style.height,
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehavior: body.style.overscrollBehavior,
      scrollRestoration: history.scrollRestoration,
    }

    history.scrollRestoration = "manual"
    window.scrollTo(0, 0)
    html.scrollTop = 0
    body.scrollTop = 0
    html.style.height = "100%"
    html.style.overflow = "hidden"
    html.style.overscrollBehavior = "none"
    body.style.height = "100%"
    body.style.overflow = "hidden"
    body.style.overscrollBehavior = "none"

    return () => {
      html.style.height = previous.htmlHeight
      html.style.overflow = previous.htmlOverflow
      html.style.overscrollBehavior = previous.htmlOverscrollBehavior
      body.style.height = previous.bodyHeight
      body.style.overflow = previous.bodyOverflow
      body.style.overscrollBehavior = previous.bodyOverscrollBehavior
      history.scrollRestoration = previous.scrollRestoration
    }
  }, [])
}
