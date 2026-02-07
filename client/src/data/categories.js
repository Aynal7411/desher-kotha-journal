export const categories = [
  {
    name: "জাতীয়",
    slug: "national",
    subs: [
      { name: "রাজনীতি", slug: "politics" },
      { name: "দুর্নীতি", slug: "corruption" },
      { name: "আইন-আদালত", slug: "law" },
      { name: "দুর্যোগ", slug: "disaster" }
    ]
  },
  {
    name: "অর্থনীতি",
    slug: "economy",
    subs: [
      { name: "বাজার", slug: "market" },
      { name: "ব্যাংকিং", slug: "banking" },
      { name: "শেয়ার", slug: "stocks" }
    ]
  },
  {
    name: "খেলা",
    slug: "sports",
    subs: [
      { name: "ক্রিকেট", slug: "cricket" },
      { name: "ফুটবল", slug: "football" },
      { name: "অন্যান্য", slug: "other" }
    ]
  },
  {
    name: "প্রযুক্তি",
    slug: "tech",
    subs: [
      { name: "স্টার্টআপ", slug: "startup" },
      { name: "মোবাইল", slug: "mobile" },
      { name: "ইন্টারনেট", slug: "internet" }
    ]
  },
  {
    name: "বিনোদন",
    slug: "entertainment",
    subs: [
      { name: "সিনেমা", slug: "cinema" },
      { name: "সংগীত", slug: "music" },
      { name: "টিভি", slug: "tv" }
    ]
  },
  {
    name: "বিশ্ব",
    slug: "world",
    subs: [
      { name: "এশিয়া", slug: "asia" },
      { name: "ইউরোপ", slug: "europe" },
      { name: "আমেরিকা", slug: "america" }
    ]
  },
  {
    name: "স্বাস্থ্য",
    slug: "health",
    subs: [
      { name: "চিকিৎসা", slug: "treatment" },
      { name: "পরামর্শ", slug: "tips" }
    ]
  },
  {
    name: "লাইফস্টাইল",
    slug: "lifestyle",
    subs: [
      { name: "ভ্রমণ", slug: "travel" },
      { name: "রান্না", slug: "food" }
    ]
  }
];

export const findCategory = (slug) => categories.find((cat) => cat.slug === slug);
