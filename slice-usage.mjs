/**
 * Usage: `npm run slice-usage`
 */
import * as prismic from "@prismicio/client"
import * as fs from "fs"

// Insert your repo name
const REPO_NAME = ""
const client = prismic.createClient(REPO_NAME)

// Keep track of the results
const sliceTypesAndUsage = new Map()

// Copy of language mapping
const mapLanguages = (lang, reverse = false) => {
  const languages = {
    "de-de": "de",
    "en-gb": "en",
  }
  if (reverse) {
    let returnLocale = "en-gb"
    Object.values(languages).map((item, index) => {
      if (item == lang) returnLocale = Object.keys(languages)[index]
    })
    return returnLocale
  }
  return languages[lang] ? languages[lang] : "en"
}
export const customTypeSlugs = {
  "de-de": {
    blog: "post",
    press: "press",
    events: "event",
    kundengeschichten: "success-story",
    insights: "landing_page",
  },
  "en-gb": {
    blog: "post",
    press: "press",
    events: "event",
    "customer-stories": "success-story",
    insights: "landing_page",
  },
}

// Copy of link resolver
const linkResolver = (doc, context) => {
  let link = "/"
  if (!doc) return "/"
  if (doc === "#") return "#"
  const newLang =
    mapLanguages(doc.lang) != "en" ? `/${mapLanguages(doc.lang)}` : ""
  if (doc.link_type == "Web" || doc.link_type == "Media") {
    return doc.url
  }
  if (doc.type === "page") {
    // console.log("doc?.data?.parentPage", doc?.data?.parentPage)
    if (doc?.data?.parentPage && doc?.data?.parentPage.uid) {
      link = `${newLang}/${doc?.data?.parentPage.uid}/${doc.uid}/`
    } else {
      link = `${newLang}/${doc.uid}/`
    }
  }
  if (customTypeSlugs[doc.lang]) {
    for (const [feSlug, prismicSlug] of Object.entries(
      customTypeSlugs[doc.lang]
    )) {
      if (prismicSlug === doc.type) {
        if (doc?.data?.externalLink?.url && context !== "seo") {
          link = doc.data.externalLink.url
        } else {
          link = `${newLang}/${feSlug}/${doc.uid}/`
        }
      }
    }
  }
  if (doc.type == "homepage") {
    link = newLang == "en" ? "/" : `${newLang}/`
  }
  if (typeof link === "string" && RegExp(/^(http|https):/g).test(link)) {
    return link
  }
  return link
}

// Function to read JSON file and extract the 'id' field
const sliceFolders = []
function extractIdFromJson(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"))
  if (data.id) {
    sliceFolders.push(data.id)
  }
}

// Function to recursively traverse directories
function readSliceDirectories(directory) {
  fs.readdirSync(directory).forEach((file) => {
    const fullPath = `${directory}/${file}`
    if (fs.statSync(fullPath).isDirectory()) {
      readSliceDirectories(fullPath) // If directory, recurse into it
    } else if (fullPath.endsWith("model.json")) {
      extractIdFromJson(fullPath) // If model.json, extract 'id'
    }
  })
}

// Function to recursively find string in JSON
function findStringInJson(json, targetString, rootItem = null, results = []) {
  // Handle arrays differently to keep track of the specific item
  if (Array.isArray(json)) {
    for (let i = 0; i < json.length; i++) {
      // Use the array item as the rootItem for recursive calls
      findStringInJson(json[i], targetString, rootItem || json[i], results)
    }
  } else if (typeof json === "object" && json !== null) {
    for (const key in json) {
      // If the current property is an object or array, call the function recursively
      if (typeof json[key] === "object") {
        findStringInJson(json[key], targetString, rootItem, results)
      } else if (json[key] === targetString) {
        results.push(rootItem)
      }
    }
  }
  return results
}

function searchInJson(data, searchString) {
  const matches = []
  function recursiveSearch(obj, searchString) {
    if (typeof obj === "object" && obj !== null) {
      // If it's an object (array or dict), iterate through its properties
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Check if the key contains the search string
          if (key.includes(searchString)) {
            matches.push(`Key: ${key}`)
          }
          // Recursively search the value
          recursiveSearch(obj[key], searchString)
        }
      }
    } else if (Array.isArray(obj)) {
      // If it's an array, iterate through its elements
      obj.forEach((item) => recursiveSearch(item, searchString))
    } else {
      // If it's a primitive type (string, number, etc.), check if it contains the search string
      if (String(obj).includes(searchString)) {
        matches.push(`Value: ${obj}`)
      }
    }
  }

  recursiveSearch(data, searchString)
  return matches
}

const getAll = async () => {
  // Get all docs from the repo (this might take a few seconds)
  const all = await client.dangerouslyGetAll({
    lang: "*",
    fetchLinks: ["page.parentPage"],
  })
  // console.log("all", all)

  // const occurrences = searchInJson(all, "Ilg")
  // console.log("Results:", occurrences.length, occurrences)

  // Find any references to a specific record to see if it's still used
  // const recordId = "Y-S8qRAAACEAjUHh"
  // const results = findStringInJson(all, recordId)
  // console.log(`Usage for record "${recordId}":\n`, results)

  // Filter by specific slice to find how how it's used
  // const slice_type = "landingpage_hero"
  // all.forEach((doc) =>
  //   doc.data.slices?.forEach((slice) => {
  //     if (slice.slice_type === slice_type && slice.variation === "slider") {
  //       console.log(
  //         `\nFound ${slice_type} on page ${linkResolver(
  //           doc
  //         )}\n${`https://${REPO_NAME}.prismic.io/documents~b=working&c=published&l=${doc.lang}/${doc.id}/`}\n`,
  //         slice,
  //         "\n"
  //       )
  //     }
  //   })
  // )

  // Filter by specific content type and condition
  // const contentType = await client.getAllByType("page", { lang: "*" })
  // contentType
  //   .filter((doc) => doc.data.landingPage)
  //   .forEach((doc) =>
  //     console.log(
  //       `\nhttps://${REPO_NAME}.prismic.io/documents~b=working&c=published&l=${doc.lang}/${doc.id}/\n`,
  //       doc,
  //       "\n"
  //     )
  //   )

  // Process all docs
  listPages(all)
  // all.forEach((doc) => {
  // collectSliceTypesAndUsage(doc)
  // })

  // // // Log a list of all Slice types in results
  // console.log("\n-----------------------------------------")
  // console.log("Slice types and usage:\n")
  // console.log(sliceTypesAndUsage)
  // console.log("\n-----------------------------------------")
  // console.log("Rarely used slices:\n")
  // readSliceDirectories("slices")
  // await findUnusedSlices()
}

const listPages = (all) => {
  let pages = new Set([])
  all.forEach((doc) => {
    if (!(doc.type === "press" && doc.data.type)) {
      pages.add(linkResolver(doc))
    }
  })
  console.log("All pages:\n", pages.size, Array.from(pages).sort().join("\n"))
}

const findUnusedSlices = async () => {
  sliceTypesAndUsage.forEach((usage, name) => {
    if (usage.length < 5) {
      console.log(`${name}:\n${usage.map((page) => page.url).join("\n")}\n`)
    }
  })

  const unusedSlices = sliceFolders.filter(
    (item) => !sliceTypesAndUsage.has(item)
  )
  console.log("\n-----------------------------------------")
  console.log("Unused completely:\n", unusedSlices)
  // Commenting out because this is not right, it's checking custom types, not slices
  // console.log("\nDouble checking unused by getting all entries for the type:")
  // unusedSlices.forEach(async (type) => {
  //   let sliceUsage = await client.getAllByType(type, { lang: "*" })
  //   console.log(type, sliceUsage)
  // })
}

const collectSliceTypesAndUsage = async ({ uid, id, type, lang, data }) => {
  data?.slices?.forEach((slice) => {
    // Keep track of the slice type and usage:
    let pageInfo = {
      uid, // URL slug
      type, // e.g. landing_page, press, success-story, ...
      // id,
      // lang,
      prismic: `https://${REPO_NAME}.prismic.io/documents~b=working&c=published&l=${lang}/${id}/`,
      url: linkResolver({ uid, id, type, lang, data }),
    }
    // console.log('pageInfo', pageInfo)
    if (sliceTypesAndUsage.has(slice.slice_type)) {
      sliceTypesAndUsage.get(slice.slice_type).push(pageInfo)
    } else {
      sliceTypesAndUsage.set(slice.slice_type, [pageInfo])
    }
  })

  // special slicesGlobal handling for blog posts
  data?.slicesGlobal?.forEach((slice) => {
    // Keep track of the slice type and usage:
    let pageInfo = {
      uid, // URL slug
      type, // e.g. landing_page, press, success-story, ...
      // id,
      // lang,
      prismic: `https://${REPO_NAME}.prismic.io/documents~b=working&c=published&l=${lang}/${id}/`,
      url: linkResolver({ uid, id, type, lang, data }),
    }
    // console.log('pageInfo', pageInfo)
    if (sliceTypesAndUsage.has(slice.slice_type)) {
      sliceTypesAndUsage.get(slice.slice_type).push(pageInfo)
    } else {
      sliceTypesAndUsage.set(slice.slice_type, [pageInfo])
    }
  })
}

getAll()
