\`\`\`markdown

# **TS Logo Design Specifications**

## **Visual Design**

The TS logo consists of:

* **"TS" letters** in bold Merriweather serif font  
* **Star symbol (✦)** positioned below the letters

## **Typography**

**Font Family:** Merriweather (serif)

* Available via Google Fonts: https://fonts.google.com/specimen/Merriweather  
* Font Weight: Bold (700)

**Size Ratios:**

* TS Letters: 65% of total logo size  
* Star Symbol: 45% of total logo size  
* Vertical offset: Star positioned at \-5% to slightly overlap with letters

## **Color Palette**

### **Primary Colors (Default)**

* **TS Letters:** \`\#191970\` (Midnight Blue)  
* **Star Symbol:** \`\#cfb53b\` (Old Gold)

### **Alternate Color Schemes**

**Navy & Gold (used in header)**

* TS Letters: \`\#000080\` (Navy)  
* Star Symbol: \`\#efbf04\` (Gold)

**White & Gold (used on dark backgrounds)**

* TS Letters: \`\#ffffff\` (White)  
* Star Symbol: \`\#efbf04\` (Gold)

## **Effects**

**Text Shadow:**

* Glow effect using accent color at 25% opacity  
* Shadow: \`0 0 8px {accentColor}40\`

## **Brand Meaning**

The TS acronym is intentionally multi-faceted:

* **T**rusted **S**eller  
* **T**rusted **B**uyer   
* **T**hrift**S**eller  
* **T**hrift**B**uyer  
* **T**hrift**S**hopper

This flexibility allows the badge to represent trust and community across both buyers and sellers in the marketplace.

## **Usage Examples**

**Sizes:**

* Small (24px): Navigation icons, badges  
* Medium (32px): Buttons, seller mode toggle  
* Large (40px): Header logo, profile displays  
* Extra Large (64px+): Marketing materials, splash screens

## **Component Code**

\`\`\`tsx  
import { TSLogo } from './components/TSLogo';

// Default midnight blue & old gold  
\<TSLogo size={40} /\>

// Navy & gold  
\<TSLogo size={40} primaryColor="\#000080" accentColor="\#efbf04" /\>

// White & gold (for dark backgrounds)  
\<TSLogo size={40} primaryColor="\#ffffff" accentColor="\#efbf04" /\>  
\`\`\`

