# Bike Fit Precision

Build a modern web application called "Bike Fit Finder".

This application is designed to help cyclists determine which high-end road bike frames best match a professional bike fit.

The design should be clean, minimalist and premium, similar to Apple, Garmin Connect or Notion.

Use a white background with subtle greys, blue accents and modern typography.

The application should be responsive and work on desktop, tablet and mobile.

-------------------------------------------------------

HOME PAGE

-------------------------------------------------------

Display a dashboard with four cards.

Card 1:

"My Fit"

Display:

Handlebar X: 470 mm

Handlebar Y: 631 mm

Frame Reach: 381 mm

Frame Stack: 586 mm

Stem: 100 mm

Spacer Height: 0 mm

Saddle Height: 916 mm

Saddle Setback: 62 mm

-------------------------------------------------------

Card 2

"Current Bike"

Giant Defy Advanced 1 (2014)

Frame Reach: 381

Frame Stack: 586

-------------------------------------------------------

Card 3

"Target Bike"

This should initially display:

"No bike selected"

-------------------------------------------------------

Card 4

"Top Matches"

Initially empty.

-------------------------------------------------------

SIDEBAR

-------------------------------------------------------

Create a sidebar containing:

Dashboard

Bike Database

Compare Bikes

Fit Calculator

Settings

-------------------------------------------------------

BIKE DATABASE

-------------------------------------------------------

Create an empty table with these columns:

Brand

Model

Year

Size

Frame Reach

Frame Stack

Head Tube

Wheelbase

Front Centre

BB Drop

Tyre Clearance

Weight

Stem

Integrated Cockpit

Notes

The table should support:

Sorting

Filtering

Searching

-------------------------------------------------------

COMPARE PAGE

-------------------------------------------------------

Create a comparison page with two dropdowns.

Bike A

Bike B

Display comparison cards underneath.

Leave calculations empty for now.

-------------------------------------------------------

FIT CALCULATOR

-------------------------------------------------------

Create a page that contains:

Target Handlebar X

Target Handlebar Y

Target Stem Length

Target Spacer Height

Target Saddle Height

Target Saddle Setback

Leave calculated outputs blank.

-------------------------------------------------------

SETTINGS

-------------------------------------------------------

Create placeholder settings.

-------------------------------------------------------

Do NOT use fake geometry data.

Leave all bike database rows empty.

Focus on building an excellent user interface and application structure that can be populated later.

Use modern React best practices.

Use reusable components throughout.

Make the application feel like a premium engineering tool rather than a shopping website.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/b6c7c358-2076-4e4e-ac81-d50423032fe2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
