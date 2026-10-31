# Bugfix: printing the cards printed the whole page

## Current behavior

WHEN the owner pressed "Print the cards" on the Sealed page THEN the system printed the jar, the "Sealed!" heading, the self-check, the card fan and the next steps above the cards.

## Expected behavior

WHEN the owner prints THEN the system SHALL print only the friends' cards and the owner's key, one page each.

## Unchanged behavior

- WHEN the page is on screen THEN the system SHALL CONTINUE TO show the Sealed page and hide the print area.
- WHEN printing THEN the system SHALL CONTINUE TO print cards in black-and-white line art with the fold line.
