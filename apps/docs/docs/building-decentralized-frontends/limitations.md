---
sidebar_position: 5
---

# Limitations

Since components are truly being executed in hidden iframes then their output is composited onto the page, there are some web technologies which are not supported or are limited in their support. This is a list of known limitations and workarounds

## Access to `window`

Components do not access to the `window` object and its APIs