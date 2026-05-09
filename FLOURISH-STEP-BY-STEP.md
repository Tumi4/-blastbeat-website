# Flourish — Step-by-Step (Robert version)

> The 10-minute guide to building Blastbeat's first interactive map.
> No code involved. Coffee recommended.

---

## What you're doing

Adding an interactive world map to the **Impact** page on the Blastbeat website. The map will show all 19 countries we've run in, coloured by how many students each chapter has reached. Visitors can hover or click each country to see the chapter detail.

You're using a free tool called **Flourish** to build the chart. It exports a single URL. You send that URL to me, and I drop it into the website.

---

## Before you start

You need:

- A web browser (any modern one)
- About 10 minutes
- An email address you can check (for the Flourish sign-up confirmation). `info@blastbeat.education` is ideal — that way the account belongs to Blastbeat, not just to you.

That's it.

---

## Step 1 — Sign up at flourish.studio

Go to **https://flourish.studio**.

- Click **"Sign up"** (top right)
- Use the Blastbeat email + a strong password
- Check the inbox, click the confirmation link
- You'll land in your empty Flourish dashboard

---

## Step 2 — Start a new visualisation

On the dashboard:

- Click the big **"+ New visualisation"** button
- A template gallery opens
- In the search box at the top, type: **`projection map`**
- Click the template called **"Projection map"** (it's a flat world-map template, NOT the 3D one)
- Click **"Use this template"**

You're now inside the chart editor.

---

## Step 3 — Replace the demo data with Blastbeat data

Flourish opens with sample data already loaded. We replace it.

- At the top of the editor, click the **"Data"** tab
- You'll see a spreadsheet
- Click any cell, then **Cmd/Ctrl + A** to select all, **Delete** to clear
- Then click **"Paste data"** (top of the data panel)

**Paste this exactly:**

```
country,iso,students_reached,year_started,programme,blurb
Ireland,IE,82000,2003,Founding chapter,Where it all started in 2003.
United Kingdom,GB,46000,2007,Active,Programme launched in London 2007.
Spain,ES,21000,2010,Active,Strong Catalonia and Madrid presence.
Netherlands,NL,18500,2011,Active,Amsterdam-based hub.
Croatia,HR,9200,2012,Active,Zagreb cohort + coastal events.
Italy,IT,12800,2013,Active,Northern Italy school network.
Hungary,HU,7400,2013,Active,Budapest founding cohort.
Poland,PL,11200,2014,Active,Warsaw and Krakow chapters.
France,FR,16800,2014,Active,Paris and Lyon programmes.
Belgium,BE,6800,2015,Active,Brussels chapter.
Germany,DE,14200,2015,Active,Berlin-led, expanding south.
Czech Republic,CZ,5400,2016,Active,Prague chapter.
Slovakia,SK,3900,2016,Active,Bratislava cohort.
Slovenia,SI,2800,2016,Active,Ljubljana cohort.
Austria,AT,4600,2017,Active,Vienna chapter.
Kenya,KE,28000,2018,African chapter,First African chapter — Nairobi-led.
South Africa,ZA,52000,2020,Active growth market,Strongest current growth — Western Cape.
Namibia,NA,7800,2024,New territory,Newest chapter — Windhoek-led 2024 launch.
Northern Ireland,GB,8500,2009,Active,Belfast cohort.
```

- Click **"Save and back to chart"** (or similar)
- The map should now be coloured for our 19 countries. If it's not, see step 3a below.

### Step 3a (only if the map looks blank)

- Look for a panel called **"Bind data"** or **"Geography"** (usually in the sidebar)
- Make sure the **Region** field is set to: **`iso`** (the column with our 2-letter codes)
- Make sure the **Value** / **Color** field is set to: **`students_reached`**
- The map will now light up.

---

## Step 4 — Make it look like Blastbeat

Click the **"Settings"** or **"Customise"** panel (paint-roller icon, usually right side).

You'll see a long list of tabs. Apply these values. If you can't find a field by name, find the closest one and just match the colour:

### Colours

| Field | Value |
|---|---|
| Background colour | **`#0F0F1A`** |
| Country fill — lowest | **`#1A1A2E`** |
| Country fill — highest | **`#B8FF00`** |
| Country fill — middle (if there's a third stop) | **`#00F5FF`** |
| Hidden countries (rest of world) | **`#0E0E18`** |
| Country border on hover | **`#FFD93D`** |
| Tooltip background | **`#0F0F1A`** |
| Tooltip border | **`#00F5FF`** |
| Tooltip text | **`#FFFFFF`** |

### Layout

| Field | Value |
|---|---|
| Show chart title above the map | **No** (we already have a title on the website) |
| Show legend | **Yes** — position **bottom** |
| Legend title | `Students reached` |
| Map projection | **Robinson** |
| Zoom controls | **Yes** |
| Initial zoom | **Auto-fit** to coloured countries |

### Font

| Field | Value |
|---|---|
| Font family | **Space Grotesk** if available, otherwise any default sans |

---

## Step 5 — The clickable popup (best part)

Find the **"Popups"** or **"Tooltips"** tab in Settings.

Replace whatever's in the popup template with:

```
{country}
─────────────
Started: {year_started}
Students reached: {students_reached}
Status: {programme}

{blurb}
```

Save. Now if you hover or click any country, the popup will read like:

> **Ireland**
> ─────────────
> Started: 2003
> Students reached: 82,000
> Status: Founding chapter
>
> Where it all started in 2003.

If Flourish complains about the brackets, try double-bracing them: `{{country}}` instead of `{country}`.

---

## Step 6 — Publish

Top right of the screen, click **"Export & publish"** (or just **"Publish"**).

- Choose **"Public"** (free tier — fine for now, adds a small "Made with Flourish" badge in the corner; we can remove that later by upgrading)
- Confirm

After publish, you'll see two things:

- A **link to share** the chart
- An **"Embed"** tab — this contains an iframe URL

**Click "Embed". Copy the URL.** It will look like:

```
https://flo.uri.sh/visualisation/12345678/embed
```

That's the only thing the website needs.

---

## Step 7 — Send the URL to me

Just paste the URL in your reply. Something like:

> "Here's the chart: https://flo.uri.sh/visualisation/12345678/embed"

I'll plug it into the website's prepared slot on the Impact page (90 seconds), commit, push, and the chart will be live.

---

## If something goes wrong

| Problem | Fix |
|---|---|
| **The map is blank.** | Step 3a above — your geography field probably isn't pointing at `iso`. |
| **The colours look wrong.** | Double-check the hex codes have the `#` in front. |
| **The popup is empty or shows literal `{country}` text.** | The bracket style is wrong — switch `{country}` to `{{country}}` and save again. |
| **Flourish wants me to upgrade to publish.** | Stop. The Free tier publishes Public charts. If you're being asked to pay, you may have selected a premium template — go back to step 2 and search "projection map" again to make sure you're on the free template. |
| **Northern Ireland looks like part of the UK.** | That's expected — they share the ISO code `GB`. We can split with sub-regions in v2 if you want. |

---

## If you'd rather have Claude's browser extension do it

Open Claude with the browser extension active. Paste this prompt as a single message — it contains all the context Claude needs to drive Flourish for you:

```
You are helping me build my first Flourish.studio chart for the
Blastbeat Education website. Free tier is fine. I'll be next to you
the whole time. Don't bypass authentication — pause and ask me to
type passwords or click verification links.

GOAL: end the session with a published Flourish embed URL of the
form https://flo.uri.sh/visualisation/<id>/embed that I can paste
into our website.

STEPS

1. Open https://flourish.studio. Sign in (pause for me to enter
   credentials).
2. Click "+ New visualisation".
3. Search the gallery for "projection map" and choose "Projection
   map" (NOT 3D, NOT Marker).
4. In the Data tab, paste the CSV from the DATA block below,
   replacing all sample data.
5. Confirm Flourish maps the geography column to "iso" and the value
   column to "students_reached".
6. Open Settings. Apply the styling values from the STYLING block
   below. Where you can't find a named field, pick the closest
   equivalent and tell me what you chose.
7. Set the popup/tooltip template per the TOOLTIP block below. If
   Flourish uses double curly braces, swap { } for {{ }}.
8. Top right, "Export & publish" → "Public".
9. Find the "Embed" tab. Copy the iframe URL — it starts
   https://flo.uri.sh/visualisation/ and ends /embed.
10. Paste that URL in your reply. That URL is the only thing I need.

DATA

country,iso,students_reached,year_started,programme,blurb
Ireland,IE,82000,2003,Founding chapter,Where it all started in 2003.
United Kingdom,GB,46000,2007,Active,Programme launched in London 2007.
Spain,ES,21000,2010,Active,Strong Catalonia and Madrid presence.
Netherlands,NL,18500,2011,Active,Amsterdam-based hub.
Croatia,HR,9200,2012,Active,Zagreb cohort + coastal events.
Italy,IT,12800,2013,Active,Northern Italy school network.
Hungary,HU,7400,2013,Active,Budapest founding cohort.
Poland,PL,11200,2014,Active,Warsaw and Krakow chapters.
France,FR,16800,2014,Active,Paris and Lyon programmes.
Belgium,BE,6800,2015,Active,Brussels chapter.
Germany,DE,14200,2015,Active,Berlin-led, expanding south.
Czech Republic,CZ,5400,2016,Active,Prague chapter.
Slovakia,SK,3900,2016,Active,Bratislava cohort.
Slovenia,SI,2800,2016,Active,Ljubljana cohort.
Austria,AT,4600,2017,Active,Vienna chapter.
Kenya,KE,28000,2018,African chapter,First African chapter — Nairobi-led.
South Africa,ZA,52000,2020,Active growth market,Strongest current growth — Western Cape.
Namibia,NA,7800,2024,New territory,Newest chapter — Windhoek-led 2024 launch.
Northern Ireland,GB,8500,2009,Active,Belfast cohort.

STYLING

Background: #0F0F1A
Country fill, low value: #1A1A2E
Country fill, high value: #B8FF00
Country fill, mid (if 3-stop): #00F5FF
Hidden / unused countries: #0E0E18
Country border: thin, low-opacity grey
Country border on hover: #FFD93D
Tooltip background: #0F0F1A
Tooltip border colour: #00F5FF
Tooltip text colour: #FFFFFF
Font: Space Grotesk if available, else default sans
Show legend: yes, position bottom, title "Students reached"
Show chart title above the map: NO
Map projection: Robinson (or Equal Earth as fallback)
Zoom controls: yes
Initial zoom: auto-fit

TOOLTIP

Title: {country}
Body lines:
  Started: {year_started}
  Students reached: {students_reached}
  Status: {programme}
  (blank line)
  {blurb}

If Flourish uses double curly braces, switch { } to {{ }}.

NOTES
- Don't bypass auth.
- If a styling field has no obvious match, pick closest and tell me.
- If publish requires a paid plan, stop — Public publish should be
  free.
- Final answer is just the embed URL.
```

That's it. About 10 minutes.

— Send me the URL when you have it and I'll close out the loop.
