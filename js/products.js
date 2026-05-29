/**
 * Product Catalog - Essential Lubricants Website
 * Handles: Product data, filtering, rendering
 */

'use strict';

/**
 * Product Catalog Data Store
 * Contains all products organized by brand and category.
 * Each product follows the Product data model defined in the design document.
 *
 * @typedef {Object} Product
 * @property {string} id - Unique identifier (slug format)
 * @property {string} name - Product display name
 * @property {string} brand - Parent brand ("kluber" | "chemetall" | "lawas")
 * @property {string} category - Category slug
 * @property {string} description - Short description (max 200 chars)
 * @property {string[]} applications - List of industrial applications
 * @property {string[]} industries - Target industries
 * @property {string} image - Path to product image
 * @property {Object} specifications - Key technical specs
 */

var productCatalog = {
  brands: [
    {
      id: "kluber",
      name: "Kluber Lubrication",
      logo: "assets/images/kluber-logo.png",
      categories: [
        {
          id: "specialty-greases",
          name: "Specialty Greases",
          description: "High-performance greases for extreme conditions including high temperature, high speed, and heavy load applications.",
          products: [
            {
              id: "kluber-isoflex-nbu-15",
              name: "ISOFLEX NBU 15",
              brand: "kluber",
              category: "specialty-greases",
              description: "Long-life grease for high-speed rolling bearings in machine tools, spindles, and precision equipment with low noise characteristics.",
              applications: ["High-speed spindles", "Rolling bearings", "Precision instruments", "Electric motors"],
              industries: ["Automotive", "Manufacturing", "Textile", "Machine Tools"],
              image: "assets/images/products/isoflex-nbu-15.webp",
              specifications: {
                baseOil: "Ester oil",
                thickener: "Barium complex soap",
                tempRange: "-40°C to +130°C",
                nlgiGrade: "1-2",
                baseOilViscosity: "15 mm²/s at 40°C"
              }
            },
            {
              id: "kluber-staburags-nbu-30",
              name: "STABURAGS NBU 30",
              brand: "kluber",
              category: "specialty-greases",
              description: "High-temperature grease for rolling and plain bearings operating under heavy loads in steel, cement, and power industries.",
              applications: ["Kiln bearings", "Conveyor bearings", "Oven bearings", "Heavy-duty rolling bearings"],
              industries: ["Steel", "Cement", "Power Generation", "Mining"],
              image: "assets/images/products/staburags-nbu-30.webp",
              specifications: {
                baseOil: "Mineral oil",
                thickener: "Polyurea",
                tempRange: "-20°C to +180°C",
                nlgiGrade: "2",
                baseOilViscosity: "30 mm²/s at 40°C"
              }
            },
            {
              id: "kluber-kluberplex-bem-41-141",
              name: "KLUBERPLEX BEM 41-141",
              brand: "kluber",
              category: "specialty-greases",
              description: "Adhesive high-temperature grease for slow-moving large bearings, open gears, and heavily loaded joints in harsh environments.",
              applications: ["Open gears", "Large bearings", "Heavily loaded joints", "Bucket pins"],
              industries: ["Mining", "Cement", "Steel", "Construction"],
              image: "assets/images/products/kluberplex-bem-41-141.webp",
              specifications: {
                baseOil: "Mineral oil",
                thickener: "Lithium soap",
                tempRange: "-30°C to +150°C",
                nlgiGrade: "1",
                baseOilViscosity: "141 mm²/s at 40°C"
              }
            }
          ]
        },
        {
          id: "synthetic-oils",
          name: "Synthetic Oils",
          description: "Premium synthetic lubricating oils for gears, compressors, and high-performance industrial machinery.",
          products: [
            {
              id: "kluber-klubersynth-gh-6-220",
              name: "KLUBERSYNTH GH 6-220",
              brand: "kluber",
              category: "synthetic-oils",
              description: "Synthetic gear oil for worm and helical gears offering excellent wear protection and extended oil change intervals.",
              applications: ["Worm gears", "Helical gears", "Bevel gears", "Spur gears"],
              industries: ["Manufacturing", "Food Processing", "Packaging", "Textile"],
              image: "assets/images/products/klubersynth-gh-6-220.webp",
              specifications: {
                baseOil: "Polyglycol",
                viscosity: "220 mm²/s at 40°C",
                tempRange: "-25°C to +200°C",
                flashPoint: "260°C",
                pourPoint: "-39°C"
              }
            },
            {
              id: "kluber-klubersynth-uh1-6-460",
              name: "KLUBERSYNTH UH1 6-460",
              brand: "kluber",
              category: "synthetic-oils",
              description: "NSF H1 registered food-grade synthetic gear oil for use in food and beverage processing equipment.",
              applications: ["Food-grade gearboxes", "Bottling lines", "Packaging machines", "Conveyor drives"],
              industries: ["Food Processing", "Beverage", "Pharmaceutical", "Packaging"],
              image: "assets/images/products/klubersynth-uh1-6-460.webp",
              specifications: {
                baseOil: "Polyalphaolefin (PAO)",
                viscosity: "460 mm²/s at 40°C",
                tempRange: "-40°C to +120°C",
                certification: "NSF H1",
                pourPoint: "-45°C"
              }
            }
          ]
        },
        {
          id: "chain-oils",
          name: "Chain Oils",
          description: "Specialized lubricants for chains operating at high temperatures and in demanding conveyor applications.",
          products: [
            {
              id: "kluber-klubersynth-chm-2-260",
              name: "KLUBERSYNTH CHM 2-260",
              brand: "kluber",
              category: "chain-oils",
              description: "High-temperature chain oil for continuous operation in ovens, dryers, and coating lines with minimal residue formation.",
              applications: ["Oven chains", "Dryer chains", "Coating line chains", "Stenter frames"],
              industries: ["Textile", "Automotive", "Food Processing", "Packaging"],
              image: "assets/images/products/klubersynth-chm-2-260.webp",
              specifications: {
                baseOil: "Synthetic ester",
                viscosity: "26 mm²/s at 40°C",
                tempRange: "Up to +260°C",
                evaporationLoss: "Low",
                residueFormation: "Minimal"
              }
            },
            {
              id: "kluber-structovis-bhd-75-s",
              name: "STRUCTOVIS BHD 75 S",
              brand: "kluber",
              category: "chain-oils",
              description: "Adhesive fluid grease for conveyor and transport chains in dusty environments with excellent wear protection.",
              applications: ["Conveyor chains", "Transport chains", "Roller chains", "Leaf chains"],
              industries: ["Automotive", "Manufacturing", "Steel", "Cement"],
              image: "assets/images/products/structovis-bhd-75-s.webp",
              specifications: {
                baseOil: "Mineral oil",
                viscosity: "75 mm²/s at 40°C",
                tempRange: "-20°C to +150°C",
                type: "Fluid grease",
                adhesion: "High"
              }
            }
          ]
        },
        {
          id: "textile-lubricants",
          name: "Textile Lubricants",
          description: "Specialized lubricants designed for textile machinery including spinning, weaving, and knitting equipment.",
          products: [
            {
              id: "kluber-klubertex-s-42",
              name: "KLUBERTEX S 42",
              brand: "kluber",
              category: "textile-lubricants",
              description: "Synthetic spindle oil for high-speed textile spindles providing low friction and excellent heat dissipation.",
              applications: ["Ring spinning spindles", "Twisting spindles", "Winding machines", "Roving frames"],
              industries: ["Textile", "Yarn Manufacturing"],
              image: "assets/images/products/klubertex-s-42.webp",
              specifications: {
                baseOil: "Synthetic ester",
                viscosity: "4.2 mm²/s at 40°C",
                tempRange: "-20°C to +80°C",
                type: "Spindle oil",
                staining: "Non-staining"
              }
            },
            {
              id: "kluber-kluberknit-s-21",
              name: "KLUBER KNIT S 21",
              brand: "kluber",
              category: "textile-lubricants",
              description: "Needle oil for knitting machines that prevents needle corrosion and does not stain fabrics during production.",
              applications: ["Knitting needles", "Sinkers", "Knitting machine cylinders", "Cam systems"],
              industries: ["Textile", "Garment Manufacturing"],
              image: "assets/images/products/kluber-knit-s-21.webp",
              specifications: {
                baseOil: "Synthetic",
                viscosity: "21 mm²/s at 40°C",
                tempRange: "-10°C to +60°C",
                type: "Needle oil",
                staining: "Non-staining"
              }
            }
          ]
        }
      ]
    },
    {
      id: "chemetall",
      name: "BASF Chemetall",
      logo: "assets/images/chemetall-logo.png",
      categories: [
        {
          id: "metalworking-fluids",
          name: "Metalworking Fluids",
          description: "High-performance cutting, grinding, and forming fluids for precision metalworking operations.",
          products: [
            {
              id: "chemetall-gardomer-l6332",
              name: "Gardomer L6332",
              brand: "chemetall",
              category: "metalworking-fluids",
              description: "Semi-synthetic water-miscible cutting fluid for general machining of ferrous and non-ferrous metals with long sump life.",
              applications: ["Turning", "Milling", "Drilling", "Grinding"],
              industries: ["Automotive", "Manufacturing", "Aerospace", "Machine Tools"],
              image: "assets/images/products/gardomer-l6332.webp",
              specifications: {
                type: "Semi-synthetic",
                dilution: "3-8%",
                phValue: "8.8-9.3",
                metals: "Ferrous and non-ferrous",
                sumpLife: "Extended"
              }
            },
            {
              id: "chemetall-gardomer-l6800",
              name: "Gardomer L6800",
              brand: "chemetall",
              category: "metalworking-fluids",
              description: "High-performance synthetic grinding fluid for precision grinding of hardened steel and carbide tools.",
              applications: ["Surface grinding", "Cylindrical grinding", "Centerless grinding", "Tool grinding"],
              industries: ["Automotive", "Aerospace", "Tool Manufacturing", "Precision Engineering"],
              image: "assets/images/products/gardomer-l6800.webp",
              specifications: {
                type: "Synthetic",
                dilution: "2-5%",
                phValue: "9.0-9.5",
                metals: "Hardened steel, carbide",
                foaming: "Low"
              }
            },
            {
              id: "chemetall-gardomer-l5120",
              name: "Gardomer L5120",
              brand: "chemetall",
              category: "metalworking-fluids",
              description: "Neat cutting oil for heavy-duty machining operations including deep hole drilling, broaching, and gear hobbing.",
              applications: ["Deep hole drilling", "Broaching", "Gear hobbing", "Thread cutting"],
              industries: ["Automotive", "Heavy Engineering", "Gear Manufacturing"],
              image: "assets/images/products/gardomer-l5120.webp",
              specifications: {
                type: "Neat oil",
                viscosity: "12 mm²/s at 40°C",
                flashPoint: "170°C",
                chlorineFree: "Yes",
                epAdditives: "Active sulphur"
              }
            }
          ]
        },
        {
          id: "rust-preventives",
          name: "Rust Preventives",
          description: "Corrosion protection solutions for in-process, inter-operation, and long-term storage of metal components.",
          products: [
            {
              id: "chemetall-gardokor-s5160",
              name: "Gardokor S5160",
              brand: "chemetall",
              category: "rust-preventives",
              description: "Solvent-based rust preventive oil for long-term indoor storage of machined ferrous components and assemblies.",
              applications: ["Indoor storage protection", "Inter-operation protection", "Finished parts", "Assemblies"],
              industries: ["Automotive", "Manufacturing", "Heavy Engineering", "Warehousing"],
              image: "assets/images/products/gardokor-s5160.webp",
              specifications: {
                type: "Solvent-based",
                filmType: "Oily",
                protection: "Up to 12 months indoor",
                application: "Dip, spray, brush",
                removal: "Alkaline cleaner"
              }
            },
            {
              id: "chemetall-gardokor-w6100",
              name: "Gardokor W6100",
              brand: "chemetall",
              category: "rust-preventives",
              description: "Water-based rust preventive for short-term inter-operation protection of ferrous metals in manufacturing lines.",
              applications: ["Inter-operation protection", "In-process protection", "Assembly lines", "CNC machined parts"],
              industries: ["Automotive", "Manufacturing", "Precision Engineering"],
              image: "assets/images/products/gardokor-w6100.webp",
              specifications: {
                type: "Water-based",
                dilution: "5-10%",
                protection: "Up to 4 weeks",
                filmType: "Dry transparent",
                application: "Dip, spray"
              }
            }
          ]
        },
        {
          id: "cleaners",
          name: "Cleaners",
          description: "Industrial cleaning solutions for degreasing, surface preparation, and maintenance of metal components.",
          products: [
            {
              id: "chemetall-gardoclean-s5160",
              name: "Gardoclean S5160",
              brand: "chemetall",
              category: "cleaners",
              description: "Alkaline spray cleaner for removing oils, greases, and machining residues from ferrous and aluminium components.",
              applications: ["Spray washing", "Parts cleaning", "Pre-treatment cleaning", "Degreasing"],
              industries: ["Automotive", "Manufacturing", "Surface Treatment", "Electroplating"],
              image: "assets/images/products/gardoclean-s5160.webp",
              specifications: {
                type: "Alkaline",
                concentration: "2-5%",
                temperature: "50-70°C",
                application: "Spray",
                metals: "Ferrous, aluminium"
              }
            },
            {
              id: "chemetall-gardoclean-t5200",
              name: "Gardoclean T5200",
              brand: "chemetall",
              category: "cleaners",
              description: "Multi-metal immersion cleaner for heavy-duty degreasing of steel, cast iron, and aluminium in dip tanks.",
              applications: ["Dip tank cleaning", "Heavy degreasing", "Multi-stage washing", "Ultrasonic cleaning"],
              industries: ["Automotive", "Heavy Engineering", "Foundry", "Heat Treatment"],
              image: "assets/images/products/gardoclean-t5200.webp",
              specifications: {
                type: "Alkaline",
                concentration: "3-6%",
                temperature: "60-80°C",
                application: "Immersion/Dip",
                metals: "Steel, cast iron, aluminium"
              }
            },
            {
              id: "chemetall-gardoclean-s5080",
              name: "Gardoclean S5080",
              brand: "chemetall",
              category: "cleaners",
              description: "Low-foam alkaline cleaner for high-pressure spray systems used in automotive and precision component washing.",
              applications: ["High-pressure spray", "Robotic washing", "Tunnel washers", "Component cleaning"],
              industries: ["Automotive", "Precision Engineering", "Aerospace"],
              image: "assets/images/products/gardoclean-s5080.webp",
              specifications: {
                type: "Alkaline, low-foam",
                concentration: "2-4%",
                temperature: "45-65°C",
                application: "High-pressure spray",
                foaming: "Ultra-low"
              }
            }
          ]
        }
      ]
    },
    {
      id: "lawas",
      name: "Lawas Lube Specialties",
      logo: "assets/images/lawas-logo.png",
      categories: [
        {
          id: "industrial-greases",
          name: "Industrial Greases",
          description: "General-purpose and specialty greases for industrial bearings, gears, and heavy-duty equipment.",
          products: [
            {
              id: "lawas-lawgrease-ep-2",
              name: "LAWGREASE EP 2",
              brand: "lawas",
              category: "industrial-greases",
              description: "Lithium EP grease for general industrial bearings and chassis applications with excellent water resistance.",
              applications: ["Industrial bearings", "Chassis lubrication", "Conveyor bearings", "Pillow blocks"],
              industries: ["Manufacturing", "Steel", "Cement", "Mining"],
              image: "assets/images/products/lawgrease-ep-2.webp",
              specifications: {
                baseOil: "Mineral oil",
                thickener: "Lithium 12-hydroxystearate",
                nlgiGrade: "2",
                tempRange: "-20°C to +130°C",
                epProperties: "Timken OK load 18 kg"
              }
            },
            {
              id: "lawas-lawgrease-mp-3",
              name: "LAWGREASE MP 3",
              brand: "lawas",
              category: "industrial-greases",
              description: "Multi-purpose lithium grease for automotive and industrial applications requiring NLGI 3 consistency.",
              applications: ["Wheel bearings", "Universal joints", "Water pumps", "General lubrication"],
              industries: ["Automotive", "Manufacturing", "Transport"],
              image: "assets/images/products/lawgrease-mp-3.webp",
              specifications: {
                baseOil: "Mineral oil",
                thickener: "Lithium soap",
                nlgiGrade: "3",
                tempRange: "-15°C to +120°C",
                droppingPoint: "185°C"
              }
            },
            {
              id: "lawas-lawgrease-ht-complex",
              name: "LAWGREASE HT Complex",
              brand: "lawas",
              category: "industrial-greases",
              description: "Lithium complex grease for high-temperature bearings in steel plants, kilns, and continuous casting machines.",
              applications: ["High-temperature bearings", "Kiln car bearings", "Continuous caster", "Hot rolling mills"],
              industries: ["Steel", "Cement", "Power Generation", "Glass"],
              image: "assets/images/products/lawgrease-ht-complex.webp",
              specifications: {
                baseOil: "Mineral oil",
                thickener: "Lithium complex",
                nlgiGrade: "2",
                tempRange: "-20°C to +170°C",
                droppingPoint: "260°C"
              }
            }
          ]
        },
        {
          id: "hydraulic-oils",
          name: "Hydraulic Oils",
          description: "Premium hydraulic fluids for industrial hydraulic systems, injection moulding, and mobile equipment.",
          products: [
            {
              id: "lawas-lawhyd-aw-68",
              name: "LAWHYD AW 68",
              brand: "lawas",
              category: "hydraulic-oils",
              description: "Anti-wear hydraulic oil for industrial hydraulic systems operating under moderate to heavy loads and temperatures.",
              applications: ["Hydraulic presses", "Injection moulding", "CNC machines", "Industrial hydraulics"],
              industries: ["Manufacturing", "Automotive", "Plastics", "Machine Tools"],
              image: "assets/images/products/lawhyd-aw-68.webp",
              specifications: {
                viscosity: "68 mm²/s at 40°C",
                viscosityIndex: "98",
                flashPoint: "230°C",
                pourPoint: "-21°C",
                standard: "IS 3098 / DIN 51524 Part 2"
              }
            },
            {
              id: "lawas-lawhyd-aw-46",
              name: "LAWHYD AW 46",
              brand: "lawas",
              category: "hydraulic-oils",
              description: "Premium anti-wear hydraulic oil for precision hydraulic systems in CNC machines and automated equipment.",
              applications: ["CNC hydraulics", "Automated lines", "Precision presses", "Servo hydraulics"],
              industries: ["Manufacturing", "Automotive", "Aerospace", "Electronics"],
              image: "assets/images/products/lawhyd-aw-46.webp",
              specifications: {
                viscosity: "46 mm²/s at 40°C",
                viscosityIndex: "100",
                flashPoint: "220°C",
                pourPoint: "-24°C",
                standard: "IS 3098 / DIN 51524 Part 2"
              }
            }
          ]
        },
        {
          id: "gear-oils",
          name: "Gear Oils",
          description: "Extreme pressure gear oils for enclosed industrial gearboxes, worm drives, and heavy-duty transmissions.",
          products: [
            {
              id: "lawas-lawgear-ep-220",
              name: "LAWGEAR EP 220",
              brand: "lawas",
              category: "gear-oils",
              description: "Extreme pressure industrial gear oil for enclosed gearboxes, worm drives, and heavily loaded gear systems.",
              applications: ["Enclosed gearboxes", "Worm drives", "Spur gears", "Helical gears"],
              industries: ["Manufacturing", "Steel", "Cement", "Mining"],
              image: "assets/images/products/lawgear-ep-220.webp",
              specifications: {
                viscosity: "220 mm²/s at 40°C",
                viscosityIndex: "95",
                flashPoint: "240°C",
                pourPoint: "-18°C",
                standard: "IS 8406 / AGMA 5 EP"
              }
            },
            {
              id: "lawas-lawgear-ep-320",
              name: "LAWGEAR EP 320",
              brand: "lawas",
              category: "gear-oils",
              description: "Heavy-duty EP gear oil for large industrial gearboxes in cement, sugar, and power generation plants.",
              applications: ["Large gearboxes", "Ball mills", "Kiln drives", "Crusher gearboxes"],
              industries: ["Cement", "Sugar", "Power Generation", "Mining"],
              image: "assets/images/products/lawgear-ep-320.webp",
              specifications: {
                viscosity: "320 mm²/s at 40°C",
                viscosityIndex: "95",
                flashPoint: "250°C",
                pourPoint: "-15°C",
                standard: "IS 8406 / AGMA 6 EP"
              }
            },
            {
              id: "lawas-lawgear-syn-150",
              name: "LAWGEAR SYN 150",
              brand: "lawas",
              category: "gear-oils",
              description: "Synthetic PAO-based gear oil for high-efficiency gearboxes requiring extended drain intervals and energy savings.",
              applications: ["High-efficiency gearboxes", "Precision gear drives", "Compressor gears", "Turbine gears"],
              industries: ["Manufacturing", "Power Generation", "Chemical", "Pharmaceutical"],
              image: "assets/images/products/lawgear-syn-150.webp",
              specifications: {
                baseOil: "Polyalphaolefin (PAO)",
                viscosity: "150 mm²/s at 40°C",
                viscosityIndex: "152",
                flashPoint: "250°C",
                pourPoint: "-42°C"
              }
            }
          ]
        }
      ]
    }
  ]
};

/**
 * Brand Priority for sorting.
 * Lower number = higher priority.
 * Kluber products appear first, then Chemetall, then Lawas.
 */
var BRAND_PRIORITY = { kluber: 0, chemetall: 1, lawas: 2 };

/**
 * Flattens the nested product catalog into a single array of all products.
 * Iterates through all brands and their categories to collect every product.
 *
 * @returns {Product[]} Array of all products in the catalog
 */
function getAllProducts() {
  var products = [];
  var brands = productCatalog.brands;
  for (var i = 0; i < brands.length; i++) {
    var categories = brands[i].categories;
    for (var j = 0; j < categories.length; j++) {
      var categoryProducts = categories[j].products;
      for (var k = 0; k < categoryProducts.length; k++) {
        products.push(categoryProducts[k]);
      }
    }
  }
  return products;
}

/**
 * Filters products by brand and/or category, then sorts by brand priority.
 * This is a pure function with no side effects or DOM manipulation.
 *
 * - If brandId is not null, only products with matching brand are included.
 * - If categoryId is not null, only products with matching category are included.
 * - If both are null, all products are returned.
 * - Results are always sorted by brand priority: Kluber (0) → Chemetall (1) → Lawas (2).
 * - The function is idempotent: same inputs always produce the same output.
 *
 * @param {string|null} brandId - Brand identifier to filter by, or null for all brands
 * @param {string|null} categoryId - Category identifier to filter by, or null for all categories
 * @returns {Product[]} Filtered and sorted array of products
 *
 * Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.8, 2.9
 */
function filterProducts(brandId, categoryId) {
  var allProducts = getAllProducts();
  var filtered = [];

  for (var i = 0; i < allProducts.length; i++) {
    var product = allProducts[i];

    // Apply brand filter when brandId is not null
    if (brandId !== null && product.brand !== brandId) {
      continue;
    }

    // Apply category filter when categoryId is not null
    if (categoryId !== null && product.category !== categoryId) {
      continue;
    }

    filtered.push(product);
  }

  // Sort by brand priority: kluber (0) → chemetall (1) → lawas (2)
  filtered.sort(function (a, b) {
    var priorityA = BRAND_PRIORITY[a.brand] !== undefined ? BRAND_PRIORITY[a.brand] : 999;
    var priorityB = BRAND_PRIORITY[b.brand] !== undefined ? BRAND_PRIORITY[b.brand] : 999;
    return priorityA - priorityB;
  });

  return filtered;
}

/**
 * Brand display names for badges and alt text.
 */
var BRAND_NAMES = {
  kluber: 'Kluber Lubrication',
  chemetall: 'BASF Chemetall',
  lawas: 'Lawas Lube Specialties'
};

/**
 * WhatsApp number for product inquiry CTA buttons.
 */
var WHATSAPP_NUMBER = '919422966662';

/**
 * Truncates a string to the specified maximum length, appending "..." if truncated.
 *
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum allowed length (default 200)
 * @returns {string} Truncated text with "..." if it exceeded maxLength
 */
function truncateDescription(text, maxLength) {
  if (maxLength === undefined) {
    maxLength = 200;
  }
  if (!text || text.length <= maxLength) {
    return text || '';
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * Creates a product card DOM element (article.product-card) for a given product.
 *
 * The card contains:
 * - Lazy-loaded image with data-src and proper alt text ("{product.name} - {brand name}")
 * - Brand badge (span.product-card__badge) with brand name
 * - Product name (h3.product-card__title)
 * - Description (p.product-card__description) truncated to 200 characters
 * - CTA button (a.product-card__cta) linking to WhatsApp inquiry
 *
 * Uses semantic HTML (article element) and ensures accessibility with proper alt text.
 *
 * @param {Product} product - A valid product object from the catalog
 * @returns {HTMLElement} An article element representing the product card
 *
 * Preconditions:
 * - product is a valid object with id, name, brand, description, image properties
 * - product.brand is one of: "kluber", "chemetall", "lawas"
 *
 * Postconditions:
 * - Returns a single DOM element (article.product-card)
 * - Card contains image, brand badge, title, description, CTA
 * - Alt text format: "{product.name} - {brand display name}"
 * - Description is truncated to 200 characters maximum
 * - No side effects on input product object
 *
 * Validates: Requirements 2.1, 2.2, 9.4
 */
function createProductCard(product) {
  var brandName = BRAND_NAMES[product.brand] || product.brand;
  var altText = product.name + ' - ' + brandName;
  var whatsappMessage = 'Hi, I would like to inquire about ' + product.name + ' (' + brandName + '). Please share details.';
  var whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(whatsappMessage);

  // Create article element (semantic HTML)
  var card = document.createElement('article');
  card.className = 'product-card';
  card.setAttribute('data-product-id', product.id);
  card.setAttribute('data-brand', product.brand);

  // Image container with lazy-loaded image using picture element for WebP with JPEG fallback
  var imageContainer = document.createElement('div');
  imageContainer.className = 'product-card__image-container';

  var picture = document.createElement('picture');

  // WebP source (preferred format)
  var sourceWebp = document.createElement('source');
  sourceWebp.setAttribute('type', 'image/webp');
  sourceWebp.setAttribute('data-srcset', product.image + ' 300w, ' + product.image + ' 600w');
  sourceWebp.setAttribute('sizes', '(max-width: 576px) 100vw, (max-width: 1024px) 50vw, 33vw');
  picture.appendChild(sourceWebp);

  // JPEG fallback image
  var jpegPath = product.image.replace(/\.webp$/, '.jpg');
  var img = document.createElement('img');
  img.className = 'product-card__image';
  img.setAttribute('data-src', jpegPath);
  img.setAttribute('alt', altText);
  img.setAttribute('width', '300');
  img.setAttribute('height', '200');
  img.setAttribute('loading', 'lazy');
  img.setAttribute('data-srcset', jpegPath + ' 300w, ' + jpegPath + ' 600w');
  img.setAttribute('sizes', '(max-width: 576px) 100vw, (max-width: 1024px) 50vw, 33vw');
  picture.appendChild(img);

  imageContainer.appendChild(picture);

  // Brand badge
  var badge = document.createElement('span');
  badge.className = 'product-card__badge product-card__badge--' + product.brand;
  badge.textContent = brandName;
  imageContainer.appendChild(badge);

  card.appendChild(imageContainer);

  // Card body
  var body = document.createElement('div');
  body.className = 'product-card__body';

  // Product title
  var title = document.createElement('h3');
  title.className = 'product-card__title';
  title.textContent = product.name;
  body.appendChild(title);

  // Product description (truncated to 200 chars)
  var desc = document.createElement('p');
  desc.className = 'product-card__description';
  desc.textContent = truncateDescription(product.description, 200);
  body.appendChild(desc);

  // CTA button linking to WhatsApp inquiry
  var cta = document.createElement('a');
  cta.className = 'product-card__cta';
  cta.href = whatsappUrl;
  cta.target = '_blank';
  cta.rel = 'noopener noreferrer';
  cta.textContent = 'Inquire on WhatsApp';
  cta.setAttribute('aria-label', 'Inquire about ' + product.name + ' on WhatsApp');
  body.appendChild(cta);

  card.appendChild(body);

  return card;
}

/**
 * Renders the product grid by clearing and populating the .product-grid container.
 *
 * - If products array is empty, shows an empty state message
 * - Otherwise, creates and appends a card for each product
 * - Announces changes to screen readers via aria-live region
 *
 * @param {Product[]} products - Array of product objects to render
 *
 * Preconditions:
 * - A .product-grid element exists in the DOM
 * - products is an array (may be empty)
 *
 * Postconditions:
 * - .product-grid contains either product cards or an empty state message
 * - Screen readers are notified of content changes via aria-live
 *
 * Validates: Requirements 2.1, 2.2, 2.7
 */
function renderProductGrid(products) {
  var grid = document.querySelector('.product-grid');
  if (!grid) {
    return;
  }

  // Clear existing content
  grid.innerHTML = '';

  // Handle empty state
  if (!products || products.length === 0) {
    var emptyState = document.createElement('div');
    emptyState.className = 'product-grid__empty';
    emptyState.setAttribute('role', 'status');

    var emptyIcon = document.createElement('div');
    emptyIcon.className = 'product-grid__empty-icon';
    emptyIcon.setAttribute('aria-hidden', 'true');
    emptyIcon.innerHTML = '<svg viewBox="0 0 24 24" width="48" height="48"><path fill="currentColor" d="M11 15h2v2h-2zm0-8h2v6h-2zm1-5C6.47 2 2 6.5 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16z"/></svg>';
    emptyState.appendChild(emptyIcon);

    var emptyTitle = document.createElement('h3');
    emptyTitle.className = 'product-grid__empty-title';
    emptyTitle.textContent = 'No products found';
    emptyState.appendChild(emptyTitle);

    var emptyText = document.createElement('p');
    emptyText.className = 'product-grid__empty-text';
    emptyText.textContent = 'No products match the selected filters. Try adjusting your filter criteria or clear all filters to see all products.';
    emptyState.appendChild(emptyText);

    grid.appendChild(emptyState);
  } else {
    // Render product cards
    for (var i = 0; i < products.length; i++) {
      var card = createProductCard(products[i]);
      grid.appendChild(card);
    }
  }

  // Announce to screen readers via aria-live region
  var liveRegion = document.querySelector('.product-grid-announcer');
  if (!liveRegion) {
    liveRegion = document.createElement('div');
    liveRegion.className = 'product-grid-announcer';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className += ' sr-only';
    grid.parentNode.insertBefore(liveRegion, grid.nextSibling);
  }

  if (!products || products.length === 0) {
    liveRegion.textContent = 'No products found for the selected filters.';
  } else {
    liveRegion.textContent = products.length + ' product' + (products.length === 1 ? '' : 's') + ' displayed.';
  }
}

/**
 * Gets all unique category objects from the product catalog.
 * Used to build category filter buttons dynamically if needed.
 *
 * @returns {Array<{id: string, name: string}>} Array of category objects
 */
function getAllCategories() {
  var categories = [];
  var seen = {};
  var brands = productCatalog.brands;
  for (var i = 0; i < brands.length; i++) {
    var brandCategories = brands[i].categories;
    for (var j = 0; j < brandCategories.length; j++) {
      var cat = brandCategories[j];
      if (!seen[cat.id]) {
        seen[cat.id] = true;
        categories.push({ id: cat.id, name: cat.name });
      }
    }
  }
  return categories;
}

/**
 * Product Catalog Page Initialization
 *
 * Handles:
 * - Rendering all products on initial page load (sorted by brand priority)
 * - Attaching click handlers to brand and category filter buttons
 * - Implementing toggle/deselection: clicking an active filter deselects it (Requirement 2.11)
 * - Updating aria-pressed states on filter buttons (Requirement 9.1)
 * - Calling renderProductGrid with filtered results
 * - Ensuring filter buttons are keyboard-navigable (Enter/Space activate via native button behavior)
 *
 * Validates: Requirements 2.10, 2.11, 9.1, 9.2, 12.3
 */
document.addEventListener('DOMContentLoaded', function () {
  // Current active filter state
  var activeBrand = null;
  var activeCategory = null;

  // Get all filter buttons
  var brandButtons = document.querySelectorAll('.filter-btn--brand');
  var categoryButtons = document.querySelectorAll('.filter-btn--category');

  /**
   * Updates aria-pressed states on all filter buttons to reflect current selection.
   */
  function updateFilterButtonStates() {
    var i;
    for (i = 0; i < brandButtons.length; i++) {
      var btn = brandButtons[i];
      var isActive = btn.getAttribute('data-brand') === activeBrand;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      if (isActive) {
        btn.classList.add('filter-btn--active');
      } else {
        btn.classList.remove('filter-btn--active');
      }
    }
    for (i = 0; i < categoryButtons.length; i++) {
      var catBtn = categoryButtons[i];
      var isCatActive = catBtn.getAttribute('data-category') === activeCategory;
      catBtn.setAttribute('aria-pressed', isCatActive ? 'true' : 'false');
      if (isCatActive) {
        catBtn.classList.add('filter-btn--active');
      } else {
        catBtn.classList.remove('filter-btn--active');
      }
    }
  }

  /**
   * Applies the current filters and re-renders the product grid.
   */
  function applyFilters() {
    var results = filterProducts(activeBrand, activeCategory);
    renderProductGrid(results);
    updateFilterButtonStates();
  }

  // Attach click handlers to brand filter buttons
  for (var i = 0; i < brandButtons.length; i++) {
    brandButtons[i].addEventListener('click', function () {
      var brand = this.getAttribute('data-brand');
      // Toggle/deselection: clicking active filter deselects it (Requirement 2.11)
      if (activeBrand === brand) {
        activeBrand = null;
      } else {
        activeBrand = brand;
      }
      applyFilters();
    });
  }

  // Attach click handlers to category filter buttons
  for (var j = 0; j < categoryButtons.length; j++) {
    categoryButtons[j].addEventListener('click', function () {
      var category = this.getAttribute('data-category');
      // Toggle/deselection: clicking active filter deselects it (Requirement 2.11)
      if (activeCategory === category) {
        activeCategory = null;
      } else {
        activeCategory = category;
      }
      applyFilters();
    });
  }

  // Initial render: show all products sorted by brand priority (Requirement 2.10)
  applyFilters();
});
