# Design

## Root cause

The page-change animation wrapped every page in `<div class="route">`. The print rule hid `main > .page > *:not(.print-area)`, which no longer matched once `.page` sat one level deeper, so nothing was hidden.

## Fix

Hide `main .page > :not(.print-area)` at any depth, and turn off the `.route` animation and padding in print.

## Property to test

For the Sealed page in print media: the hero and the next steps are not visible, and the first card is.
