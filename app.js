let platforms = [];
let presets = [];
let printPlatformIds = new Set();

async function loadSizekitData() {
  if (location.protocol === "file:" && window.SIZEKIT_DATA) {
    applySizekitData(window.SIZEKIT_DATA);
    return;
  }

  let data = window.SIZEKIT_DATA;
  try {
    const response = await fetch("data.json", { cache: "no-store" });
    if (response.ok) {
      data = await response.json();
    } else if (!data) {
      throw new Error(`Failed to load data.json: ${response.status}`);
    }
  } catch (error) {
    if (!data) throw error;
  }

  applySizekitData(data);
}

function applySizekitData(data) {
  platforms = Array.isArray(data.platforms) ? data.platforms : [];
  presets = Array.isArray(data.presets) ? data.presets : [];
  printPlatformIds = new Set(Array.isArray(data.printPlatformIds) ? data.printPlatformIds : []);
}

const UI_TEXT = {
  zh: {
    all: "全部",
    print: "印刷",
    allUnits: "全部单位",
    allRatios: "全部比例",
    defaultSort: "默认排序",
    sizeAsc: "尺寸从小到大",
    sizeDesc: "尺寸从大到小",
    showImages: "显示图片",
    showSizes: "显示尺寸",
    searchSize: "搜索尺寸",
    switchLight: "切换浅色主题",
    switchDark: "切换深色主题",
    switchLanguage: "切换语言",
    chooseImages: "选择本地图片",
    languageButton: "中文",
    sizeDetail: "尺寸详情",
    size: "尺寸",
    ratio: "比例",
    unit: "单位",
    type: "类型",
    safeArea: "安全区 / 出血",
    dpiConvert: "DPI 像素换算",
    dpiNote: "按成品尺寸估算，印刷以前以印厂文件为准。",
    copySize: "复制尺寸",
    copyRatio: "复制比例",
    noImages: "没有找到可预览的图片",
    addedImages: count => `已加入 ${count} 张图片`,
    copied: text => `已复制：${text}`,
    dpiSuggestion: dpi => `${dpi} dpi 建议`,
    notApplicable: "不适用",
    loadError: "数据加载失败，请检查 data.json"
  },
  en: {
    all: "All",
    print: "Print",
    allUnits: "All units",
    allRatios: "All ratios",
    defaultSort: "Default",
    sizeAsc: "Size ascending",
    sizeDesc: "Size descending",
    showImages: "Images",
    showSizes: "Sizes",
    searchSize: "Search sizes",
    switchLight: "Switch to light theme",
    switchDark: "Switch to dark theme",
    switchLanguage: "Switch language",
    chooseImages: "Choose local images",
    languageButton: "EN",
    sizeDetail: "Size details",
    size: "Size",
    ratio: "Ratio",
    unit: "Unit",
    type: "Type",
    safeArea: "Safe area / bleed",
    dpiConvert: "DPI pixel conversion",
    dpiNote: "Estimated from final size. Confirm print files with your print vendor.",
    copySize: "Copy size",
    copyRatio: "Copy ratio",
    noImages: "No previewable images found",
    addedImages: count => `Added ${count} image${count === 1 ? "" : "s"}`,
    copied: text => `Copied: ${text}`,
    dpiSuggestion: dpi => `${dpi} dpi suggested`,
    notApplicable: "N/A",
    loadError: "Failed to load data. Check data.json."
  }
};

const ratioFilters = [
  { id: "all", labelKey: "allRatios", ratio: null },
  { id: "ratio-1-1", label: "1:1", ratio: 1 },
  { id: "ratio-3-4", label: "3:4", ratio: 3 / 4 },
  { id: "ratio-4-3", label: "4:3", ratio: 4 / 3 },
  { id: "ratio-9-16", label: "9:16", ratio: 9 / 16 },
  { id: "ratio-16-9", label: "16:9", ratio: 16 / 9 },
  { id: "ratio-4-5", label: "4:5", ratio: 4 / 5 },
  { id: "ratio-5-4", label: "5:4", ratio: 5 / 4 }
];

const sortOptions = [
  { id: "default", labelKey: "defaultSort" },
  { id: "size-asc", labelKey: "sizeAsc" },
  { id: "size-desc", labelKey: "sizeDesc" }
];

const BOARD_SIZE_FONT_MIN = 9;
const BOARD_SIZE_FONT_MAX = 18;
const PREVIEW_IMAGE_MAX_EDGE = 1600;
const IMAGE_CACHE_DB = "sizekit-image-cache";
const IMAGE_CACHE_STORE = "cache";
const IMAGE_CACHE_KEY = "dropped-images";
const IMAGE_CACHE_LOCAL_KEY = "sizekit-dropped-images";

const state = {
  selectedPlatform: "all",
  ratioFilter: "all",
  sortMode: "default",
  query: "",
  theme: localStorage.getItem("sizekit-theme") || "light",
  language: localStorage.getItem("sizekit-language") || "zh",
  showImages: true,
  showSizes: true,
  images: [],
  platformOffset: 0
};

const els = {
  platformAllSlot: document.querySelector("#platformAllSlot"),
  platformCenter: document.querySelector("#platformCenter"),
  platformNav: document.querySelector("#platformNav"),
  platformHoverTitle: document.querySelector("#platformHoverTitle"),
  platformSelect: document.querySelector("#platformSelect"),
  platformSelectSummary: document.querySelector("#platformSelectSummary"),
  platformSelectPanel: document.querySelector("#platformSelectPanel"),
  filterStrip: document.querySelector("#filterStrip"),
  searchInput: document.querySelector("#searchInput"),
  artboardGrid: document.querySelector("#artboardGrid"),
  imageFileInput: document.querySelector("#imageFileInput"),
  imageFileButton: document.querySelector("#imageFileButton"),
  themeToggle: document.querySelector("#themeToggle"),
  languageToggle: document.querySelector("#languageToggle"),
  dialog: document.querySelector("#detailDialog"),
  closeDialog: document.querySelector("#closeDialog"),
  detailLogo: document.querySelector("#detailLogo"),
  detailPlatform: document.querySelector("#detailPlatform"),
  detailTitle: document.querySelector("#detailTitle"),
  detailTags: document.querySelector("#detailTags"),
  detailPreview: document.querySelector("#detailPreview"),
  detailRatioText: document.querySelector("#detailRatioText"),
  detailSize: document.querySelector("#detailSize"),
  detailRatio: document.querySelector("#detailRatio"),
  detailUnit: document.querySelector("#detailUnit"),
  detailCategory: document.querySelector("#detailCategory"),
  detailDpi: document.querySelector("#detailDpi"),
  detailBleed: document.querySelector("#detailBleed"),
  detailNote: document.querySelector("#detailNote"),
  dpiPanel: document.querySelector("#dpiPanel"),
  dpiGrid: document.querySelector("#dpiGrid"),
  copySizeButton: document.querySelector("#copySizeButton"),
  copyRatioButton: document.querySelector("#copyRatioButton"),
  toast: document.querySelector("#toast")
};

let activePreset = null;
let hoverFrame = 0;
let hoveredCard = null;
let hoverClearTimer = 0;
let temporaryPlatformHighlight = null;
let platformDrag = null;
let suppressPlatformClick = false;
let platformSelectCloseTimer = 0;
let dragDepth = 0;
let hasRenderedBoards = false;
let imageRenderVersion = 0;
let lastScrollY = window.scrollY;

const pinyinInitials = {
  "全":"q","部":"b","国":"g","内":"n","短":"d","视":"s","频":"p","海":"h","外":"w","印":"y","刷":"s",
  "微":"w","信":"x","公":"g","众":"z","号":"h","小":"x","红":"h","书":"s","通":"t","用":"y",
  "平":"p","台":"t","物":"w","料":"l","纸":"z","张":"z","名":"m","片":"p","画":"h","册":"c",
  "三":"s","折":"z","页":"y","报":"b","易":"y","拉":"l","宝":"b","头":"t","像":"x","封":"f",
  "面":"m","条":"t","次":"c","图":"t","导":"d","二":"e","维":"w","码":"m","主":"z","背":"b",
  "景":"j","配":"p","横":"h","竖":"s","方":"f","形":"x","直":"z","播":"b","屏":"p","帖":"t",
  "量":"l","缩":"s","略":"l","常":"c","规":"g","单":"d","展":"z","开":"k","欧":"o","式":"s",
  "标":"b","准":"z","含":"h","出":"c","血":"x","成":"c","品":"p","跨":"k","底":"d","安":"a",
  "区":"q","比":"b","例":"l","尺":"c","寸":"c","搜":"s","索":"s","设":"s","计":"j"
};

const PLATFORM_EN_NAMES = {
  wechat: "WeChat Official Account",
  xiaohongshu: "Xiaohongshu",
  channels: "WeChat Channels",
  shortvideo: "Short Video",
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  x: "X / Twitter",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  threads: "Threads",
  snapchat: "Snapchat",
  "google-business": "Google Business",
  behance: "Behance",
  dribbble: "Dribbble",
  bilibili: "Bilibili",
  weibo: "Weibo",
  paper: "A Series Paper",
  card: "Business Card",
  brochure: "Brochure",
  fold: "Tri-fold",
  poster: "Poster",
  rollup: "Roll-up Banner"
};

const CATEGORY_EN_NAMES = {
  "全部": "All",
  "国内新媒体": "China Social",
  "短视频": "Short Video",
  "海外平台": "Global Social",
  "设计平台": "Design",
  "平面印刷": "Print"
};

init();

function ui(key, ...args) {
  const value = UI_TEXT[state.language]?.[key] ?? UI_TEXT.zh[key] ?? key;
  return typeof value === "function" ? value(...args) : value;
}

function labelText(item) {
  return item.labelKey ? ui(item.labelKey) : item.label;
}

function applyLanguage() {
  document.documentElement.lang = state.language === "zh" ? "zh-CN" : "en";
  updateStaticToolbarIcons();
  els.searchInput.placeholder = ui("searchSize");
  els.searchInput.closest("label")?.setAttribute("aria-label", ui("searchSize"));
  els.filterStrip.setAttribute("aria-label", state.language === "zh" ? "尺寸过滤器" : "Size filters");
  els.imageFileButton.setAttribute("aria-label", ui("chooseImages"));
  els.imageFileButton.title = ui("chooseImages");
  els.languageToggle.setAttribute("aria-label", ui("switchLanguage"));
  els.languageToggle.title = ui("switchLanguage");
  els.detailTitle.textContent = ui("sizeDetail");
  els.copySizeButton.textContent = ui("copySize");
  els.copyRatioButton.textContent = ui("copyRatio");
  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = ui(element.dataset.i18n);
  });
  updateThemeToggle();
}

function updateStaticToolbarIcons() {
  const searchIcon = els.searchInput.closest("label")?.querySelector("span");
  if (searchIcon) searchIcon.innerHTML = lucideIcon(`<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>`);
  els.imageFileButton.innerHTML = lucideIcon(`<path d="M15 8h.01"/><rect width="16" height="16" x="4" y="4" rx="3"/><path d="M12 12v6"/><path d="m9 15 3-3 3 3"/>`);
  els.languageToggle.innerHTML = lucideIcon(`<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>`);
}

async function init() {
  document.documentElement.dataset.theme = state.theme;
  updateThemeToggle();
  applyLanguage();
  bindEvents();
  try {
    await loadSizekitData();
    state.images = await loadCachedImages();
    imageRenderVersion += 1;
    renderNav();
    renderPlatformSelect();
    renderFilters();
    applyLanguage();
    render();
  } catch (error) {
    console.error(error);
    els.artboardGrid.innerHTML = `<div class="load-error">${ui("loadError")}</div>`;
  } finally {
    document.documentElement.removeAttribute("data-loading");
  }
}

function bindEvents() {
  els.searchInput.addEventListener("input", event => {
    state.query = event.target.value.trim().toLowerCase();
    render();
  });
  window.addEventListener("resize", () => {
    updateMobileTopMode();
    updatePlatformActiveState();
    syncPlatformCarousel({ immediate: true });
  });
  window.addEventListener("scroll", updateMobileTopMode, { passive: true });

  els.imageFileButton.addEventListener("click", () => {
    els.imageFileInput.click();
  });
  els.imageFileInput.addEventListener("change", async event => {
    const files = Array.from(event.target.files || []);
    await handleImageFiles(files);
    event.target.value = "";
  });

  els.themeToggle.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem("sizekit-theme", state.theme);
    updateThemeToggle();
    renderNav();
    renderPlatformSelect();
    render();
  });

  els.languageToggle.addEventListener("click", () => {
    state.language = state.language === "zh" ? "en" : "zh";
    localStorage.setItem("sizekit-language", state.language);
    applyLanguage();
    renderNav();
    renderPlatformSelect();
    renderFilters();
    render();
  });

  els.platformSelect.addEventListener("mouseenter", () => {
    window.clearTimeout(platformSelectCloseTimer);
    els.platformSelect.setAttribute("open", "");
  });
  els.platformSelect.addEventListener("mouseleave", () => {
    window.clearTimeout(platformSelectCloseTimer);
    platformSelectCloseTimer = window.setTimeout(() => {
      els.platformSelect.removeAttribute("open");
    }, 140);
  });
  els.platformSelectSummary.addEventListener("click", event => {
    if (window.matchMedia("(hover: hover)").matches) {
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    els.platformSelect.toggleAttribute("open");
  });
  els.platformSelectSummary.addEventListener("focus", () => {
    if (window.matchMedia("(hover: hover)").matches) {
      els.platformSelect.setAttribute("open", "");
    }
  });
  els.platformSelect.addEventListener("focusout", event => {
    if (!els.platformSelect.contains(event.relatedTarget)) {
      els.platformSelect.removeAttribute("open");
    }
  });

  els.closeDialog.addEventListener("click", () => els.dialog.close());
  els.dialog.addEventListener("click", event => {
    if (event.target === els.dialog) els.dialog.close();
  });

  els.copySizeButton.addEventListener("click", () => {
    if (!activePreset) return;
    copyText(`${activePreset.width}×${activePreset.height} ${activePreset.unit}`);
  });
  els.copyRatioButton.addEventListener("click", () => {
    if (!activePreset) return;
    copyText(activePreset.ratio);
  });

  document.addEventListener("dragenter", event => {
    event.preventDefault();
    dragDepth += 1;
    document.body.classList.add("is-dragging");
  });
  document.addEventListener("dragover", event => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
  });
  document.addEventListener("dragleave", event => {
    event.preventDefault();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) document.body.classList.remove("is-dragging");
  });
  document.addEventListener("drop", async event => {
    event.preventDefault();
    dragDepth = 0;
    document.body.classList.remove("is-dragging");
    await handleImageDrop(event.dataTransfer);
  });
  document.addEventListener("click", event => {
    if (!els.platformSelect.contains(event.target)) {
      els.platformSelect.removeAttribute("open");
    }
  });

  els.platformNav.parentElement.addEventListener("wheel", event => {
    event.preventDefault();
    const direction = event.deltaY || event.deltaX;
    scrollPlatformPage(direction > 0 ? 1 : -1);
  }, { passive: false });

  els.platformNav.parentElement.addEventListener("pointerdown", startPlatformDrag);
  els.platformNav.parentElement.addEventListener("pointermove", handlePlatformPointerMove);
  els.platformNav.parentElement.addEventListener("pointerleave", resetPlatformDockEffect);
  els.platformNav.parentElement.addEventListener("pointerup", endPlatformDrag);
  els.platformNav.parentElement.addEventListener("pointercancel", endPlatformDrag);
  updateMobileTopMode();
}

function updateMobileTopMode() {
  const isMobile = window.matchMedia("(max-width: 760px)").matches;
  const currentScrollY = window.scrollY;
  const delta = currentScrollY - lastScrollY;

  if (!isMobile || currentScrollY <= 8) {
    document.body.classList.remove("is-mobile-compact-top");
  } else if (delta > 6) {
    document.body.classList.add("is-mobile-compact-top");
  } else if (delta < -6) {
    document.body.classList.remove("is-mobile-compact-top");
  }

  lastScrollY = currentScrollY;
}

function renderNav() {
  const items = navPlatforms();
  const renderButton = item => {
    const name = platformDisplayName(item);
    return `
    <button class="platform-button ${isPlatformButtonActive(item.id) ? "is-active" : ""}" data-platform="${item.id}" data-label="${name}" type="button" aria-label="${name}">
      <span class="icon-badge platform-icon platform-icon--${item.id} ${hasOfficialPlatformIcon(item) ? "official-icon" : ""} ${hasSvgPlatformIcon(item) ? "svg-data-icon" : ""}" style="${hasOfficialPlatformIcon(item) ? `--fallback-color:${item.color}` : `background:${item.color}`}" aria-hidden="true">${platformIconMarkup(item)}</span>
    </button>
  `;
  };

  els.platformAllSlot.innerHTML = "";
  els.platformNav.innerHTML = items.map(renderButton).join("");

  els.platformNav.querySelectorAll("button").forEach(button => {
    button.addEventListener("mouseenter", () => showPlatformTitle(button));
    button.addEventListener("focus", () => showPlatformTitle(button));
    button.addEventListener("mouseleave", hidePlatformTitle);
    button.addEventListener("blur", hidePlatformTitle);
    button.addEventListener("click", event => {
      if (suppressPlatformClick) {
        event.preventDefault();
        event.stopPropagation();
        suppressPlatformClick = false;
        return;
      }
      const platform = getPlatform(button.dataset.platform);
      if ((event.ctrlKey || event.metaKey) && platformWebsiteUrl(platform)) {
        event.preventDefault();
        window.open(platformWebsiteUrl(platform), "_blank", "noopener,noreferrer");
        return;
      }
      activatePlatform(button.dataset.platform);
    });
  });
  syncPlatformCarousel({ immediate: true });
}

function renderPlatformSelect() {
  const selected = getPlatform(state.selectedPlatform);
  const selectablePlatforms = platforms.filter(item => !printPlatformIds.has(item.id));
  els.platformSelectSummary.innerHTML = platformSelectOptionMarkup(selected, "platform-select-current");
  els.platformSelectPanel.innerHTML = selectablePlatforms.map(platform => `
    <button class="platform-select-option ${platform.id === state.selectedPlatform ? "is-active" : ""}" type="button" data-platform-select="${platform.id}">
      ${platformSelectOptionMarkup(platform)}
    </button>
  `).join("");

  els.platformSelectPanel.querySelectorAll("[data-platform-select]").forEach(button => {
    button.addEventListener("click", () => {
      activatePlatform(button.dataset.platformSelect);
      els.platformSelect.removeAttribute("open");
    });
  });
}

function platformSelectOptionMarkup(platform, extraClass = "") {
  const iconStyle = platform.id === "all"
    ? ""
    : hasOfficialPlatformIcon(platform) ? `--fallback-color:${platform.color}` : `background:${platform.color}`;
  return `
    <span class="platform-select-icon platform-icon platform-icon--${platform.id} ${hasOfficialPlatformIcon(platform) ? "official-icon" : ""} ${hasSvgPlatformIcon(platform) ? "svg-data-icon" : ""} ${extraClass}" style="${iconStyle}">${platformIconMarkup(platform)}</span>
    <span class="platform-select-name">${platformDisplayName(platform)}</span>
  `;
}

function platformDisplayName(platform) {
  if (!platform) return "";
  if (platform.id === "all") return ui("all");
  if (platform.id === "print") return ui("print");
  if (state.language === "zh") return platform.name;
  return PLATFORM_EN_NAMES[platform.id] || platform.name;
}

function localizedCategory(platform) {
  if (!platform) return "";
  if (platform.id === "all") return ui("all");
  if (platform.id === "print") return ui("print");
  if (state.language === "zh") return platform.category;
  return CATEGORY_EN_NAMES[platform.category] || platform.category;
}

function showPlatformTitle(button) {
  if (window.matchMedia("(max-width: 760px)").matches) return;
  const navRect = els.platformHoverTitle.parentElement.getBoundingClientRect();
  const buttonRect = button.getBoundingClientRect();
  els.platformHoverTitle.textContent = button.dataset.label;
  els.platformHoverTitle.style.left = `${buttonRect.left + buttonRect.width / 2 - navRect.left}px`;
  els.platformHoverTitle.classList.add("show");
}

function hidePlatformTitle() {
  els.platformHoverTitle.classList.remove("show");
}

function platformLoopItems() {
  const items = navPlatforms();
  const selectedIndex = items.findIndex(item => item.id === state.selectedPlatform);
  const centerIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const radius = Math.floor(items.length / 2);
  return Array.from({ length: items.length }, (_, index) => {
    const offset = index - radius;
    return items[(centerIndex + offset + items.length) % items.length];
  });
}

function navPlatforms() {
  return platforms.filter(item => item.id !== "all" && !printPlatformIds.has(item.id));
}

function platformIconMarkup(platform) {
  const svgMarkup = platformSvgMarkup(platform);
  if (svgMarkup) return svgMarkup;

  if (platform.iconUrl) {
    return `<img src="${platform.iconUrl}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.classList.add('icon-fallback'); this.replaceWith(document.createTextNode('${platform.short}'))">`;
  }

  return platformIcon(platform.id);
}

function platformSvgMarkup(platform) {
  const rawSvg = themedPlatformSvg(platform);
  if (typeof rawSvg !== "string") return "";
  const svg = rawSvg.trim();
  if (!svg) return "";
  if (svg.startsWith("<svg")) return svg;
  if (svg.startsWith("data:image/svg+xml")) {
    return `<img src="${svg}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  }
  return "";
}

function hasSvgPlatformIcon(platform) {
  return Boolean(platformSvgMarkup(platform));
}

function themedPlatformSvg(platform) {
  if (!platform) return "";

  const lightSvg = platform.iconSvgLight
    || platform.lightIconSvg
    || platform.svgLight
    || platform.lightSvg
    || platform.iconSvg
    || platform.svg
    || platform.svgData
    || platform.iconData;
  const darkSvg = platform.iconSvgDark
    || platform.darkIconSvg
    || platform.svgDark
    || platform.darkSvg
    || platform.iconSvgDarkData
    || platform.darkIconData;

  return state.theme === "dark" ? darkSvg || lightSvg : lightSvg || darkSvg;
}

function hasOfficialPlatformIcon(platform) {
  return Boolean(platform.iconUrl || hasSvgPlatformIcon(platform));
}

function platformWebsiteUrl(platform) {
  if (!platform || platform.id === "print" || printPlatformIds.has(platform.id)) return "";
  return platform.websiteUrl || platform.url || platform.homepage || "";
}

function platformIcon(id) {
  const icons = {
    all: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M5 5h5.2v5.2H5zM13.8 5H19v5.2h-5.2zM5 13.8h5.2V19H5zM13.8 13.8H19V19h-5.2z"/></svg>`,
    wechat: `<svg viewBox="0 0 24 24"><path d="M10.2 5.2c-4 0-7.2 2.6-7.2 5.9 0 1.8 1 3.4 2.5 4.5l-.6 2.1 2.5-1.2c.8.3 1.8.5 2.8.5.3 0 .6 0 .9-.1-.3-.7-.5-1.4-.5-2.2 0-3.1 3-5.6 6.7-5.6h.5c-1-2.3-4-3.9-7.6-3.9Zm-2.5 4.5a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Zm4.9 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8Z"/><path d="M17.3 10.7c-3 0-5.5 1.9-5.5 4.3s2.5 4.3 5.5 4.3c.7 0 1.5-.1 2.1-.4l1.9.9-.5-1.6c1.2-.8 1.9-1.9 1.9-3.2 0-2.4-2.4-4.3-5.4-4.3Zm-1.9 3.1a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Zm3.8 0a.7.7 0 1 1 0-1.4.7.7 0 0 1 0 1.4Z"/></svg>`,
    xiaohongshu: `<svg viewBox="0 0 24 24"><path d="M5 6.4C5 5.1 6.1 4 7.4 4h9.2C17.9 4 19 5.1 19 6.4v11.2c0 1.3-1.1 2.4-2.4 2.4H7.4C6.1 20 5 18.9 5 17.6V6.4Z"/><path fill="#FF2442" d="M7.3 6.7h9.4v10.6H7.3z"/><path d="M9 8.3h6v1.5H9zM9 11.2h6v1.5H9zM9 14.1h4.2v1.5H9z"/></svg>`,
    channels: `<svg viewBox="0 0 24 24"><path d="M4 12c0-4 3.4-7.2 7.6-7.2 4 0 7.2 2.8 7.5 6.5l2.2 1.4-2.2 1.4c-.5 3.4-3.7 6.1-7.5 6.1C7.4 20.2 4 16 4 12Z"/><path fill="#2FB344" d="m10.1 8.6 5.6 3.4-5.6 3.4V8.6Z"/></svg>`,
    shortvideo: `<svg viewBox="0 0 24 24"><path d="M10 4h4v3.2c1.2.9 2.6 1.4 4.2 1.4v4c-1.5 0-2.9-.3-4.2-1v4.6c0 2.7-2.2 4.8-5 4.8s-5-2.1-5-4.8 2.2-4.8 5-4.8h1v4h-1c-.6 0-1 .4-1 1s.4 1 1 1 1-.4 1-1V4Z"/></svg>`,
    youtube: `<svg viewBox="0 0 24 24"><path d="M21.4 7.2c-.2-.9-.9-1.6-1.8-1.8C18 5 12 5 12 5s-6 0-7.6.4c-.9.2-1.6.9-1.8 1.8C2.2 8.8 2.2 12 2.2 12s0 3.2.4 4.8c.2.9.9 1.6 1.8 1.8C6 19 12 19 12 19s6 0 7.6-.4c.9-.2 1.6-.9 1.8-1.8.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8ZM10 15V9l5.2 3L10 15Z"/></svg>`,
    instagram: `<svg viewBox="0 0 24 24"><path d="M8.1 3h7.8A5.1 5.1 0 0 1 21 8.1v7.8a5.1 5.1 0 0 1-5.1 5.1H8.1A5.1 5.1 0 0 1 3 15.9V8.1A5.1 5.1 0 0 1 8.1 3Zm.2 3A2.3 2.3 0 0 0 6 8.3v7.4A2.3 2.3 0 0 0 8.3 18h7.4a2.3 2.3 0 0 0 2.3-2.3V8.3A2.3 2.3 0 0 0 15.7 6H8.3Zm8.2 1.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 8.1a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8Zm0 2.7a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4Z"/></svg>`,
    tiktok: `<svg viewBox="0 0 24 24"><path class="tiktok-cyan" d="M10.4 4h4v3.2c1.1.9 2.5 1.4 4 1.4v3.8c-1.5 0-2.8-.3-4-1v4.5c0 2.6-2.2 4.7-4.9 4.7S4.7 18.5 4.7 16s2.1-4.7 4.8-4.7h.9v3.8h-.9c-.5 0-.9.4-.9.9s.4.9.9.9.9-.4.9-.9V4Z"/><path class="tiktok-red" d="M11.6 4h4v3.2c1.1.9 2.5 1.4 4 1.4v3.8c-1.5 0-2.8-.3-4-1v4.5c0 2.6-2.2 4.7-4.9 4.7S5.9 18.5 5.9 16s2.1-4.7 4.8-4.7h.9v3.8h-.9c-.5 0-.9.4-.9.9s.4.9.9.9.9-.4.9-.9V4Z"/><path d="M11 4h4v3.2c1.1.9 2.5 1.4 4 1.4v3.8c-1.5 0-2.8-.3-4-1v4.5c0 2.6-2.2 4.7-4.9 4.7S5.3 18.5 5.3 16s2.1-4.7 4.8-4.7h.9v3.8h-.9c-.5 0-.9.4-.9.9s.4.9.9.9.9-.4.9-.9V4Z"/></svg>`,
    paper: `<svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7V3Zm7 1.8V8h3.2"/></svg>`,
    card: `<svg viewBox="0 0 24 24"><path d="M4 7h16v10H4V7Zm3 3h5v1.8H7V10Zm0 3.2h10v1.6H7v-1.6Z"/></svg>`,
    brochure: `<svg viewBox="0 0 24 24"><path d="M4 5.5c2.2-.8 4.8-.7 8 .4 3.2-1.1 5.8-1.2 8-.4v13c-2.2-.8-4.8-.7-8 .4-3.2-1.1-5.8-1.2-8-.4v-13Zm8 .4v13"/></svg>`,
    fold: `<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4V5Zm5.3 0v14M14.7 5v14"/></svg>`,
    poster: `<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6V3Zm2.2 3h7.6v1.8H8.2V6Zm0 3.7h7.6v7.3H8.2V9.7Z"/></svg>`,
    rollup: `<svg viewBox="0 0 24 24"><path d="M7 3h10v14H7V3Zm-2 16h14v2H5v-2Zm4-2 3 2 3-2"/></svg>`
  };

  return icons[id] || icons.all;
}

function controlIcon(id) {
  const icons = {
    image: lucideIcon(`<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>`),
    size: lucideIcon(`<path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>`),
    sort: lucideIcon(`<path d="M3 6h18"/><path d="M7 12h10"/><path d="M10 18h4"/>`)
  };
  return icons[id] || "";
}

function lucideIcon(content) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${content}</svg>`;
}

function renderFilters() {
  const ratio = ratioFilters.find(item => item.id === state.ratioFilter) || ratioFilters[0];
  const sort = sortOptions.find(item => item.id === state.sortMode) || sortOptions[0];

  els.filterStrip.innerHTML = `
    <details class="filter-menu ratio-menu">
      <summary>${labelText(ratio)}</summary>
      <div class="filter-menu-panel">
        ${ratioFilters.map(filter => `
          <button class="filter-option ratio-option ${filter.id === state.ratioFilter ? "is-active" : ""}" type="button" data-ratio-filter="${filter.id}">
            <span class="ratio-swatch" style="${ratioSwatchStyle(filter.ratio)}">${labelText(filter)}</span>
          </button>
        `).join("")}
      </div>
    </details>
    <label class="image-toggle">
      <input id="imageToggle" type="checkbox" ${state.showImages ? "checked" : ""}>
      <span class="toggle-icon">${controlIcon("image")}</span>
      <span class="control-text">${ui("showImages")}</span>
    </label>
    <label class="image-toggle">
      <input id="sizeToggle" type="checkbox" ${state.showSizes ? "checked" : ""}>
      <span class="toggle-icon">${controlIcon("size")}</span>
      <span class="control-text">${ui("showSizes")}</span>
    </label>
    <details class="filter-menu sort-menu">
      <summary><span class="control-icon sort-icon">${controlIcon("sort")}</span><span class="control-text">${labelText(sort)}</span></summary>
      <div class="filter-menu-panel">
        ${sortOptions.map(option => `
          <button class="filter-option ${option.id === state.sortMode ? "is-active" : ""}" type="button" data-sort-mode="${option.id}">${labelText(option)}</button>
        `).join("")}
      </div>
    </details>
  `;

  els.filterStrip.querySelectorAll("[data-ratio-filter]").forEach(button => {
    button.addEventListener("click", () => {
      state.ratioFilter = button.dataset.ratioFilter;
      button.closest("details")?.removeAttribute("open");
      renderFilters();
      render();
    });
  });

  els.filterStrip.querySelector("#imageToggle").addEventListener("change", event => {
    state.showImages = event.target.checked;
    if (!state.showImages) clearBoardPreviews();
    render();
  });

  els.filterStrip.querySelector("#sizeToggle").addEventListener("change", event => {
    state.showSizes = event.target.checked;
    render();
  });

  els.filterStrip.querySelectorAll("[data-sort-mode]").forEach(button => {
    button.addEventListener("click", () => {
      state.sortMode = button.dataset.sortMode;
      button.closest("details")?.removeAttribute("open");
      renderFilters();
      render();
    });
  });
}

function ratioSwatchStyle(ratio) {
  if (!ratio) return "--ratio-w:76px; --ratio-h:34px";
  const max = 58;
  let w = max;
  let h = max;
  if (ratio >= 1) {
    h = Math.max(28, Math.round(max / ratio));
  } else {
    w = Math.max(34, Math.round(max * ratio));
  }
  return `--ratio-w:${w}px; --ratio-h:${h}px`;
}

function activatePlatform(platformId) {
  const isSamePlatform = state.selectedPlatform === platformId;
  state.selectedPlatform = platformId;
  temporaryPlatformHighlight = null;

  clearTimeout(hoverFrame);
  updatePlatformActiveState();
  renderPlatformSelect();
  hidePlatformTitle();
  if (!isSamePlatform) render();
}

function scrollPlatformPage(direction) {
  const step = Math.max(1, els.platformCenter.clientWidth * .82);
  const nextOffset = state.platformOffset + direction * step;
  state.platformOffset = Math.max(0, Math.min(maxPlatformOffset(), nextOffset));
  resetPlatformDockEffect();
  syncPlatformCarousel();
}

function startPlatformDrag(event) {
  if (event.button !== undefined && event.button !== 0) return;
  platformDrag = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startOffset: state.platformOffset,
    moved: false
  };
  els.platformCenter.classList.add("is-drag-ready");
}

function movePlatformDrag(event) {
  if (!platformDrag || platformDrag.pointerId !== event.pointerId) return;
  const dx = event.clientX - platformDrag.startX;
  const dy = event.clientY - platformDrag.startY;
  if (!platformDrag.moved && Math.abs(dx) < 12) return;
  if (!platformDrag.moved && Math.abs(dy) > Math.abs(dx) * 1.2) return;

  event.preventDefault();
  if (!platformDrag.moved) {
    els.platformCenter.setPointerCapture?.(event.pointerId);
  }
  platformDrag.moved = true;
  suppressPlatformClick = true;
  els.platformCenter.classList.add("is-dragging");
  const nextOffset = platformDrag.startOffset - dx;
  state.platformOffset = Math.max(0, Math.min(maxPlatformOffset(), nextOffset));
  syncPlatformCarousel({ immediate: true });
}

function handlePlatformPointerMove(event) {
  if (platformDrag) {
    movePlatformDrag(event);
    return;
  }
  updatePlatformDockEffect(event.clientX);
}

function endPlatformDrag(event) {
  if (!platformDrag || platformDrag.pointerId !== event.pointerId) return;
  if (els.platformCenter.hasPointerCapture?.(event.pointerId)) {
    els.platformCenter.releasePointerCapture?.(event.pointerId);
  }
  els.platformCenter.classList.remove("is-drag-ready", "is-dragging");
  resetPlatformDockEffect();
  if (!platformDrag.moved) suppressPlatformClick = false;
  if (platformDrag.moved) {
    window.setTimeout(() => {
      suppressPlatformClick = false;
    }, 180);
  }
  platformDrag = null;
}

function maxPlatformOffset() {
  return Math.max(0, els.platformNav.scrollWidth - els.platformCenter.clientWidth);
}

function updatePlatformActiveState() {
  els.platformNav.querySelectorAll(".platform-button").forEach(button => {
    button.classList.toggle("is-active", isPlatformButtonActive(button.dataset.platform));
  });
}

function isPlatformButtonActive(platformId) {
  if (temporaryPlatformHighlight) return platformId === temporaryPlatformHighlight;
  return platformId === state.selectedPlatform && !isMobileAllPlatformState(platformId);
}

function isMobileAllPlatformState(platformId) {
  return platformId === "all" && window.matchMedia("(max-width: 760px)").matches;
}

function syncPlatformCarousel({ immediate = false } = {}) {
  requestAnimationFrame(() => {
    const wrapper = els.platformCenter;
    state.platformOffset = Math.max(0, Math.min(maxPlatformOffset(), state.platformOffset));
    const navWidth = els.platformNav.scrollWidth;
    const centerOffset = maxPlatformOffset() === 0 ? Math.max(0, (wrapper.clientWidth - navWidth) / 2) : 0;
    els.platformNav.classList.toggle("no-transition", immediate);
    els.platformNav.style.transform = `translateX(${(centerOffset - state.platformOffset).toFixed(2)}px)`;

    if (immediate) requestAnimationFrame(() => els.platformNav.classList.remove("no-transition"));
  });
}

function updatePlatformDockEffect(pointerX) {
  if (isMobileViewport() || platformDrag) return;
  const influence = 128;
  const maxScale = 1.52;
  const buttons = Array.from(els.platformNav.querySelectorAll(".platform-button"));

  buttons.forEach(button => {
    const rect = button.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    const distance = Math.min(influence, Math.abs(pointerX - center));
    const strength = 1 - distance / influence;
    const eased = strength <= 0 ? 0 : Math.sin(strength * Math.PI / 2);
    const scale = 1 + eased * (maxScale - 1);
    const opacity = .62 + eased * .38;
    button.style.setProperty("--edge-scale", scale.toFixed(3));
    button.style.setProperty("--edge-opacity", opacity.toFixed(3));
  });
}

function resetPlatformDockEffect() {
  els.platformNav.querySelectorAll(".platform-button").forEach(button => {
    button.style.setProperty("--edge-scale", "1");
    button.style.setProperty("--edge-opacity", "1");
  });
}

function render() {
  const update = () => {
    const rows = filteredPresets();
    renderBoards(rows);
    hasRenderedBoards = true;
  };

  if (!hasRenderedBoards || isMobileViewport() || typeof document.startViewTransition !== "function") {
    update();
    return;
  }

  document.startViewTransition(update);
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 760px)").matches;
}

function activeFilterLabels() {
  return [
    ratioFilters.find(item => item.id === state.ratioFilter),
    sortOptions.find(item => item.id === state.sortMode)
  ].filter(item => item && item.id !== "all" && item.id !== "default").map(labelText);
}

function filteredPresets() {
  const rows = presets.filter(item => {
    const sourcePlatform = getPlatform(item.platformId);
    const platform = displayPlatformForItem(item);
    const inPlatform = state.selectedPlatform === "all"
      || item.platformId === state.selectedPlatform
      || (state.selectedPlatform === "print" && printPlatformIds.has(item.platformId));
    const inFilter = matchRatioFilter(item);
    const keywordText = [
      platformDisplayName(platform),
      platform.short,
      platform.category,
      platformDisplayName(sourcePlatform),
      sourcePlatform.short,
      item.title,
      item.ratio,
      item.unit,
      item.width,
      item.height,
      ...item.tags,
      item.note,
      item.bleed
    ].join(" ");
    const keyword = searchIndex(keywordText, item, platform);
    return inPlatform && inFilter && (!state.query || keyword.includes(state.query));
  });
  return sortPresets(rows);
}

function sortPresets(rows) {
  if (state.sortMode === "default") return rows;
  return [...rows].sort((a, b) => {
    const delta = sizeArea(a) - sizeArea(b);
    if (delta === 0) return a.title.localeCompare(b.title, "zh-CN");
    return state.sortMode === "size-asc" ? delta : -delta;
  });
}

function sizeArea(item) {
  const multiplier = item.unit === "cm" ? 10 : 1;
  return item.width * multiplier * item.height * multiplier;
}

function searchIndex(text, item, platform) {
  return [
    text,
    initialsForText(text),
    compactInitials(text),
    platformAliases(platform.id),
    item.id
  ].join(" ").toLowerCase();
}

function initialsForText(text) {
  return Array.from(text).map(char => {
    if (/[a-z0-9]/i.test(char)) return char.toLowerCase();
    return pinyinInitials[char] || " ";
  }).join("");
}

function compactInitials(text) {
  return initialsForText(text).replace(/\s+/g, "");
}

function platformAliases(id) {
  const aliases = {
    all: "qb quanbu all",
    wechat: "wx gzh wxgzh weixin gongzhonghao",
    xiaohongshu: "xhs xiaohongshu rednote",
    channels: "wx sph wxsph shipinhao",
    shortvideo: "sp sv dsp dy duanshipin douyin",
    youtube: "yt youtube",
    instagram: "ig instagram",
    tiktok: "tk tiktok",
    x: "x twitter tweet tuite",
    facebook: "fb facebook",
    linkedin: "in linkedin lingying",
    pinterest: "p pinterest pin",
    print: "ys yinshua print",
    paper: "a paper zz zhizhang",
    card: "mp mingpian card",
    brochure: "hc huace brochure",
    fold: "szy zheye fold",
    poster: "hb haibao poster",
    rollup: "ylb zhanjia rollup"
  };
  return aliases[id] || "";
}

function matchRatioFilter(item) {
  switch (state.ratioFilter) {
    case "ratio-1-1": return item.ratio.includes("1:1");
    case "ratio-3-4": return item.ratio.includes("3:4");
    case "ratio-4-3": return item.ratio.includes("4:3");
    case "ratio-9-16": return item.ratio.includes("9:16");
    case "ratio-16-9": return item.ratio.includes("16:9");
    case "ratio-4-5": return item.ratio.includes("4:5");
    case "ratio-5-4": return item.ratio.includes("5:4");
    default: return true;
  }
}

function renderBoards(rows) {
  clearHoveredCard();
  const existingCards = new Map(Array.from(els.artboardGrid.querySelectorAll(".artboard-card")).map(card => [card.dataset.id, card]));
  const renderedIds = new Set();

  rows.forEach((item, index) => {
    const renderKey = cardRenderKey(item);
    let card = existingCards.get(item.id);
    renderedIds.add(item.id);

    if (!card || card.dataset.renderKey !== renderKey) {
      const staleCard = card;
      card = createBoardCard(item, index, renderKey);
      bindBoardCard(card);
      if (staleCard) staleCard.replaceWith(card);
    } else {
      card.style.setProperty("--card-index", index);
      card.style.viewTransitionName = cardTransitionName(item.id);
    }

    if (card.parentElement !== els.artboardGrid || card !== els.artboardGrid.children[index]) {
      els.artboardGrid.appendChild(card);
    }
  });

  existingCards.forEach((card, id) => {
    if (!renderedIds.has(id)) card.remove();
  });
}

function createBoardCard(item, index, renderKey) {
    const platform = displayPlatformForItem(item);
    const sourcePlatform = getPlatform(item.platformId);
    const platformName = platformDisplayName(platform);
    const sourcePlatformName = platformDisplayName(sourcePlatform);
    const size = boardSize(item.width, item.height, 170, item.unit);
    const preview = previewForPreset(item, size);
    const detail = [platformName, sourcePlatform.id !== platform.id ? sourcePlatformName : "", ...item.tags].filter(Boolean).join(" / ");
    const showTitleIcon = !shouldHideCardPlatformIcon();
  const template = document.createElement("template");
  template.innerHTML = `
      <button class="artboard-card" data-id="${item.id}" data-highlight-platform="${platform.id}" type="button" aria-label="${platformName} ${item.title} ${formatSize(item)}" style="--card-index:${index}; view-transition-name:${cardTransitionName(item.id)}">
        <div class="artboard-stage" style="--tooltip-offset:${Math.round(size.h / 2 + 3)}px">
          <div class="board-tooltip">${detail}</div>
          <div class="artboard ${preview ? "has-preview" : ""} ${state.showSizes ? "" : "hide-size"}" data-ratio="${item.ratio}" style="--board-w:${size.w}px; --board-h:${size.h}px; --size-font:${size.font}px">
            ${preview ? renderPreview(preview) : ""}
            ${state.showSizes ? `<span class="artboard-number"><strong>${formatSize(item)}</strong><small>${item.ratio}</small></span>` : ""}
          </div>
        </div>
        <div class="board-info">
          <div class="board-title-row">
            ${showTitleIcon ? `<span class="title-icon platform-icon platform-icon--${platform.id} ${hasOfficialPlatformIcon(platform) ? "official-icon" : ""} ${hasSvgPlatformIcon(platform) ? "svg-data-icon" : ""}" style="${hasOfficialPlatformIcon(platform) ? `--fallback-color:${platform.color}` : ""}" title="${platformName}">${platformIconMarkup(platform)}</span>` : ""}
            <strong>${item.title}</strong>
          </div>
        </div>
      </button>
    `;
  const card = template.content.firstElementChild;
  card.dataset.renderKey = renderKey;
  return card;
}

function bindBoardCard(card) {
  card.addEventListener("pointerenter", () => {
    setHoveredCard(card);
  });
  card.addEventListener("pointerleave", () => {
    scheduleHoverClear(card);
  });
  card.addEventListener("click", () => {
    const item = presets.find(preset => preset.id === card.dataset.id);
    if (item) copyText(formatSize(item));
  });
}

function setHoveredCard(card) {
  window.clearTimeout(hoverClearTimer);
  if (hoveredCard && hoveredCard !== card) hoveredCard.classList.remove("is-card-hovered");
  hoveredCard = card;
  temporaryPlatformHighlight = card.dataset.highlightPlatform || null;
  els.artboardGrid.classList.add("is-card-hovering");
  card.classList.add("is-card-hovered");
  updatePlatformActiveState();
  revealPlatformButton(temporaryPlatformHighlight);
}

function scheduleHoverClear(card) {
  window.clearTimeout(hoverClearTimer);
  hoverClearTimer = window.setTimeout(() => {
    if (hoveredCard !== card) return;
    clearHoveredCard();
  }, 90);
}

function clearHoveredCard() {
  window.clearTimeout(hoverClearTimer);
  if (hoveredCard) hoveredCard.classList.remove("is-card-hovered");
  hoveredCard = null;
  temporaryPlatformHighlight = null;
  els.artboardGrid.classList.remove("is-card-hovering");
  updatePlatformActiveState();
}

function revealPlatformButton(platformId) {
  if (!platformId || platformId === "all") return;
  const escapedPlatformId = window.CSS?.escape ? CSS.escape(platformId) : platformId.replace(/"/g, '\\"');
  const button = els.platformNav.querySelector(`.platform-button[data-platform="${escapedPlatformId}"]`);
  if (!button) return;

  const wrapperWidth = els.platformCenter.clientWidth;
  const buttonLeft = button.offsetLeft;
  const buttonRight = buttonLeft + button.offsetWidth;
  const padding = 14;
  let nextOffset = state.platformOffset;

  if (buttonLeft < state.platformOffset + padding) {
    nextOffset = buttonLeft - padding;
  } else if (buttonRight > state.platformOffset + wrapperWidth - padding) {
    nextOffset = buttonRight - wrapperWidth + padding;
  }

  nextOffset = Math.max(0, Math.min(maxPlatformOffset(), nextOffset));
  if (Math.abs(nextOffset - state.platformOffset) < 1) return;
  state.platformOffset = nextOffset;
  syncPlatformCarousel();
}

function clearBoardPreviews() {
  els.artboardGrid.querySelectorAll(".preview-clip").forEach(preview => preview.remove());
  els.artboardGrid.querySelectorAll(".artboard.has-preview").forEach(board => board.classList.remove("has-preview"));
}

function cardRenderKey(item) {
  return [
    item.id,
    state.showImages ? imageRenderVersion : "no-images",
    state.showSizes ? "sizes" : "no-sizes",
    shouldHideCardPlatformIcon() ? "no-title-icon" : "title-icon"
  ].join(":");
}

function shouldHideCardPlatformIcon() {
  return state.selectedPlatform !== "all" && state.selectedPlatform !== "print" && !printPlatformIds.has(state.selectedPlatform);
}

function cardTransitionName(id) {
  return `card-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function updateThemeToggle() {
  els.themeToggle.innerHTML = themeIcon(state.theme);
  els.themeToggle.setAttribute("aria-label", state.theme === "dark" ? ui("switchLight") : ui("switchDark"));
}

function themeIcon(theme) {
  return theme === "dark"
    ? lucideIcon(`<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`)
    : lucideIcon(`<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>`);
}

function renderPreview(preview) {
  const style = `--preview-w:${preview.w}px; --preview-h:${preview.h}px; --preview-x:${preview.x}px; --preview-y:${preview.y}px`;
  return `
    <div class="preview-clip"><img src="${preview.image.url}" alt="" loading="lazy" decoding="async" style="${style}"></div>
  `;
}

function previewForPreset(item, size) {
  if (!state.images.length || !state.showImages) return null;
  const image = closestImage(item.width / item.height);
  const boardRatio = size.w / size.h;
  const imageRatio = image.width / image.height;
  let w = size.w;
  let h = size.h;

  if (imageRatio > boardRatio) {
    h = size.h;
    w = Math.round(h * imageRatio);
  } else {
    w = size.w;
    h = Math.round(w / imageRatio);
  }

  return {
    image,
    w,
    h,
    x: Math.round((size.w - w) / 2),
    y: Math.round((size.h - h) / 2)
  };
}

function closestImage(targetRatio) {
  return state.images.reduce((best, image) => {
    const currentScore = Math.abs(Math.log(image.ratio / targetRatio));
    const bestScore = Math.abs(Math.log(best.ratio / targetRatio));
    return currentScore < bestScore ? image : best;
  }, state.images[0]);
}

async function handleImageDrop(dataTransfer) {
  if (!dataTransfer) return;
  const files = await droppedFiles(dataTransfer);
  await handleImageFiles(files);
}

async function handleImageFiles(files) {
  const imageFiles = files.filter(file => file.type.startsWith("image/"));
  if (!imageFiles.length) {
    showToast(ui("noImages"));
    return;
  }

  const images = await Promise.all(imageFiles.map(loadDroppedImage));
  const loadedImages = images.filter(Boolean);
  state.images.push(...loadedImages);
  imageRenderVersion += 1;
  await saveCachedImages(state.images);
  render();
  showToast(ui("addedImages", loadedImages.length));
}

async function droppedFiles(dataTransfer) {
  const items = Array.from(dataTransfer.items || []);
  if (items.length) {
    const nested = await Promise.all(items.map(item => {
      const entry = typeof item.webkitGetAsEntry === "function" ? item.webkitGetAsEntry() : null;
      return entry ? filesFromEntry(entry) : Promise.resolve(item.getAsFile()).then(file => file ? [file] : []);
    }));
    return nested.flat();
  }

  return Array.from(dataTransfer.files || []);
}

async function filesFromEntry(entry) {
  if (entry.isFile) {
    return new Promise(resolve => entry.file(file => resolve([file]), () => resolve([])));
  }
  if (!entry.isDirectory) return [];

  const reader = entry.createReader();
  const entries = [];
  let batch = [];
  do {
    batch = await new Promise(resolve => reader.readEntries(resolve, () => resolve([])));
    entries.push(...batch);
  } while (batch.length);

  const files = await Promise.all(entries.map(filesFromEntry));
  return files.flat();
}

function loadDroppedImage(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    const image = new Image();
    image.onload = () => {
      const url = previewImageUrl(image, file.type);
      resolve({
        url,
        name: file.name,
        width: image.naturalWidth,
        height: image.naturalHeight,
        ratio: image.naturalWidth / image.naturalHeight
      });
    };
    image.onerror = () => resolve(null);
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        resolve(null);
        return;
      }
      image.src = reader.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

function previewImageUrl(image, type) {
  const maxEdge = Math.max(image.naturalWidth, image.naturalHeight);
  if (maxEdge <= PREVIEW_IMAGE_MAX_EDGE) return image.src;

  const scale = PREVIEW_IMAGE_MAX_EDGE / maxEdge;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return image.src;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(type === "image/png" ? "image/png" : "image/jpeg", .86);
}

function openImageCache() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(IMAGE_CACHE_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IMAGE_CACHE_STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadCachedImages() {
  try {
    const db = await openImageCache();
    if (!db) return await normalizeCachedImages(loadLocalCachedImages());
    return await normalizeCachedImages(await imageCacheRequest(db, "readonly", store => store.get(IMAGE_CACHE_KEY)) || []);
  } catch (error) {
    console.warn("Failed to load cached images", error);
    return await normalizeCachedImages(loadLocalCachedImages());
  }
}

async function saveCachedImages(images) {
  try {
    const db = await openImageCache();
    if (!db) {
      saveLocalCachedImages(images);
      return;
    }
    await imageCacheRequest(db, "readwrite", store => store.put(images, IMAGE_CACHE_KEY));
  } catch (error) {
    console.warn("Failed to save cached images", error);
    saveLocalCachedImages(images);
  }
}

function loadLocalCachedImages() {
  try {
    return JSON.parse(localStorage.getItem(IMAGE_CACHE_LOCAL_KEY) || "[]");
  } catch (error) {
    console.warn("Failed to read local image cache", error);
    return [];
  }
}

function saveLocalCachedImages(images) {
  try {
    localStorage.setItem(IMAGE_CACHE_LOCAL_KEY, JSON.stringify(images));
  } catch (error) {
    console.warn("Failed to write local image cache", error);
  }
}

async function normalizeCachedImages(images) {
  if (!Array.isArray(images) || !images.length) return [];

  const normalized = await Promise.all(images.map(normalizeCachedImage));
  const validImages = normalized.filter(Boolean);
  if (validImages.some((image, index) => image.url !== images[index]?.url)) {
    await saveCachedImages(validImages);
  }
  return validImages;
}

function normalizeCachedImage(cachedImage) {
  if (!cachedImage || !cachedImage.url) return Promise.resolve(null);
  return new Promise(resolve => {
    const image = new Image();
    image.onload = () => resolve({
      ...cachedImage,
      url: previewImageUrl(image, cachedImage.url.startsWith("data:image/png") ? "image/png" : "image/jpeg"),
      width: cachedImage.width || image.naturalWidth,
      height: cachedImage.height || image.naturalHeight,
      ratio: cachedImage.ratio || image.naturalWidth / image.naturalHeight
    });
    image.onerror = () => resolve(null);
    image.src = cachedImage.url;
  });
}

function imageCacheRequest(db, mode, createRequest) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(IMAGE_CACHE_STORE, mode);
    const request = createRequest(transaction.objectStore(IMAGE_CACHE_STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

function openDetail(id) {
  const item = presets.find(preset => preset.id === id);
  if (!item) return;
  const platform = displayPlatformForItem(item);
  const sourcePlatform = getPlatform(item.platformId);
  const platformName = platformDisplayName(platform);
  const sourcePlatformName = platformDisplayName(sourcePlatform);
  const size = boardSize(item.width, item.height, 200, item.unit);
  activePreset = item;

  els.detailLogo.innerHTML = platformIconMarkup(platform);
  els.detailLogo.style.background = platform.color;
  els.detailPlatform.textContent = sourcePlatform.id === platform.id ? `${localizedCategory(platform)} / ${platformName}` : `${platformName} / ${sourcePlatformName}`;
  els.detailTitle.textContent = item.title;
  els.detailTags.textContent = item.tags.join(" · ");
  els.detailPreview.style.setProperty("--board-w", `${size.w}px`);
  els.detailPreview.style.setProperty("--board-h", `${size.h}px`);
  els.detailRatioText.textContent = item.ratio;
  els.detailSize.textContent = formatSize(item);
  els.detailRatio.textContent = item.ratio;
  els.detailUnit.textContent = item.unit;
  els.detailCategory.textContent = localizedCategory(platform);
  els.detailDpi.textContent = item.dpi ? ui("dpiSuggestion", item.dpi) : ui("notApplicable");
  els.detailBleed.textContent = item.bleed;
  els.detailNote.textContent = item.note;

  renderDpi(item);
  els.dialog.showModal();
}

function renderDpi(item) {
  const isPrint = item.unit === "mm" || item.unit === "cm";
  els.dpiPanel.hidden = !isPrint;
  if (!isPrint) return;

  const mmW = item.unit === "cm" ? item.width * 10 : item.width;
  const mmH = item.unit === "cm" ? item.height * 10 : item.height;
  els.dpiGrid.innerHTML = [72, 150, 300].map(dpi => {
    const pxW = Math.round(mmW / 25.4 * dpi);
    const pxH = Math.round(mmH / 25.4 * dpi);
    return `<div class="dpi-item"><small>${dpi} dpi</small><strong>${pxW} × ${pxH} px</strong></div>`;
  }).join("");
}

function boardSize(width, height, max = 170, unit = "") {
  const ratio = width / height;
  const fitFont = boardFontSize(width, height, max, unit);
  if (ratio >= 1) {
    return { w: max, h: Math.max(48, Math.round(max / ratio)), font: fitFont };
  }
  return { w: Math.max(48, Math.round(max * ratio)), h: max, font: fitFont };
}

function boardFontSize(width, height, max, unit = "") {
  const ratio = width / height;
  const displayWidth = ratio >= 1 ? max : Math.max(48, Math.round(max * ratio));
  const textLength = `${width}×${height}${unit ? ` ${unit}` : ""}`.length;
  return Math.max(BOARD_SIZE_FONT_MIN, Math.min(BOARD_SIZE_FONT_MAX, Math.floor((displayWidth - 12) / Math.max(5.8, textLength * 0.66))));
}

function getPlatform(id) {
  return platforms.find(item => item.id === id) || platforms[0];
}

function displayPlatformForItem(item) {
  return printPlatformIds.has(item.platformId) ? getPlatform("print") : getPlatform(item.platformId);
}

function formatSize(item) {
  return `${item.width}×${item.height} ${item.unit}`;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  showToast(ui("copied", text));
}

let toastTimer;
function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 1600);
}
