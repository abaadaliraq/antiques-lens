"use client";

import {
  BadgeCheck,
  AlertTriangle,
  Check,
  ChevronDown,
  Cookie,
  Crown,
  ExternalLink,
  FileText,
  Globe2,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";import type { FormEvent, ReactNode } from "react";
import {
  getCurrentUserProfile,
  PROFILE_UPDATED_EVENT,
  updateCurrentUserProfile,
  type UserProfile,
} from "@/lib/profilesSupabase";
import { getSupabaseBrowserClient } from "@/lib/supabaseClient";
import {
  countries,
  countryLabel,
  getCountryByCode,
  getProvinceByCode,
  iraqProvinces,
  normalizeCountry,
  normalizeProvince,
  provinceLabel as getProvinceOptionLabel,
} from "@/lib/locationOptions";
import type { Locale } from "./types";

type UserMenuProps = {
  locale: Locale;
  setLocale?: (locale: Locale) => void;
  compact?: boolean;
};

const AUTH_CACHE_KEY = "kishib:auth-session-active";
const PROFILE_CACHE_PREFIX = "kishib:user-profile:";
const SUPPORT_EMAIL = "support@kishibapp.com";
const KISHIB_WEBSITE_URL = "https://kishibapp.com";

type EditableProfile = {
  name: string;
  phone: string;
  gender: string;
  country: string;
  countryCode: string;
  provinceCode: string;
  city: string;
};

type ProfileInfo = EditableProfile & {
  email: string;
  avatarUrl: string;
  userId: string;
};

type MenuCopy = {
  profile: string;
  account: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  male: string;
  female: string;
  country: string;
  province?: string;
  language: string;
  subscriptions: string;
  support: string;
  website: string;
  cookies: string;
  terms: string;
  privacy: string;
  logout: string;
  deleteAccount: string;
  deleteAccountTitle: string;
  deleteAccountWarning: string;
  deleteAccountDataWarning: string;
  deleteAccountConfirmHint: string;
  deleteAccountConfirmButton: string;
  deleteAccountSuccess: string;
  deleteAccountFailed: string;
  comingSoon: string;
  paymentDisabled: string;
  unknown: string;
  editProfile: string;
  save: string;
  cancel: string;
  saved: string;
  supportText: string;
  close: string;
  monthlyPlan: string;
  annualPlan: string;
  reportsPack: string;
  price: string;
  includes: string;
};

const COPY: Record<Locale, MenuCopy> = {
  ar: {
    profile: "Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ",
    account: "Ø§Ù„Ø­Ø³Ø§Ø¨",
    name: "Ø§Ù„Ø§Ø³Ù…",
    email: "Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„",
    phone: "Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ",
    gender: "الجنس",
    male: "ذكر",
    female: "أنثى",
    country: "Ø§Ù„Ø¯ÙˆÙ„Ø©",
    language: "Ø§Ù„Ù„ØºØ©",
    subscriptions: "Ø§Ù„Ø§Ø´ØªØ±Ø§ÙƒØ§Øª",
    support: "Ø§Ù„Ø¯Ø¹Ù…",
    website: "Ù…ÙˆÙ‚Ø¹ KISHIB",
    cookies: "Ø§Ù„ÙƒÙˆÙƒÙŠØ²",
    terms: "Ø§Ù„Ø´Ø±ÙˆØ· ÙˆØ§Ù„Ø£Ø­ÙƒØ§Ù…",
    privacy: "Ø³ÙŠØ§Ø³Ø© Ø§Ù„Ø®ØµÙˆØµÙŠØ©",
    logout: "ØªØ³Ø¬ÙŠÙ„ Ø®Ø±ÙˆØ¬",
    deleteAccount: "Ø­Ø°Ù Ø§Ù„Ø­Ø³Ø§Ø¨",
    deleteAccountTitle: "Ø­Ø°Ù Ø§Ù„Ø­Ø³Ø§Ø¨",
    deleteAccountWarning: "Ù‡Ø°Ø§ Ø§Ù„Ø¥Ø¬Ø±Ø§Ø¡ Ù†Ù‡Ø§Ø¦ÙŠ ÙˆÙ„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ±Ø§Ø¬Ø¹ Ø¹Ù†Ù‡.",
    deleteAccountDataWarning: "Ø³ÙŠØªÙ… Ø­Ø°Ù Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆØ¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ ÙˆØ³Ø¬Ù„ Ø§Ù„ØªÙ‚ÙŠÙŠÙ…Ø§Øª ÙˆØ§Ù„ØµÙˆØ± ÙˆØ§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ù…Ø±ØªØ¨Ø·Ø© Ø¨Ø§Ù„Ø­Ø³Ø§Ø¨ Ù‚Ø¯Ø± Ø§Ù„Ø¥Ù…ÙƒØ§Ù†.",
    deleteAccountConfirmHint: "Ø§ÙƒØªØ¨ DELETE Ø£Ùˆ Ø­Ø°Ù Ù„ØªÙØ¹ÙŠÙ„ Ø§Ù„Ø­Ø°Ù.",
    deleteAccountConfirmButton: "Ø­Ø°Ù Ø§Ù„Ø­Ø³Ø§Ø¨ Ù†Ù‡Ø§Ø¦ÙŠÙ‹Ø§",
    deleteAccountSuccess: "ØªÙ… Ø­Ø°Ù Ø§Ù„Ø­Ø³Ø§Ø¨ ÙˆØ¨ÙŠØ§Ù†Ø§ØªÙ‡ Ø¨Ù†Ø¬Ø§Ø­.",
    deleteAccountFailed: "ØªØ¹Ø°Ø± Ø­Ø°Ù Ø§Ù„Ø­Ø³Ø§Ø¨. Ø­Ø§ÙˆÙ„ÙŠ Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.",
    comingSoon: "Ù‚Ø±ÙŠØ¨Ø§Ù‹",
    paymentDisabled: "Ø§Ù„Ø¯ÙØ¹ ØºÙŠØ± Ù…ÙØ¹Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹",
    unknown: "ØºÙŠØ± Ù…Ø¶Ø§Ù",
    editProfile: "ØªØ¹Ø¯ÙŠÙ„ Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ",
    save: "Ø­ÙØ¸",
    cancel: "Ø¥Ù„ØºØ§Ø¡",
    saved: "ØªÙ… Ø§Ù„Ø­ÙØ¸",
    supportText: "Ù„Ù„Ø¯Ø¹Ù… ÙˆØ§Ù„Ù…Ø³Ø§Ø¹Ø¯Ø© ØªÙˆØ§ØµÙ„ Ù…Ø¹Ù†Ø§ Ø¹Ø¨Ø± Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ",
    close: "Ø¥ØºÙ„Ø§Ù‚",
    monthlyPlan: "Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ Ø§Ù„Ø´Ù‡Ø±ÙŠ",
    annualPlan: "Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ Ø§Ù„Ø³Ù†ÙˆÙŠ",
    reportsPack: "Ø¨Ø§Ù‚Ø© Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±",
    price: "Ø§Ù„Ø³Ø¹Ø±",
    includes: "ÙŠØ´Ù…Ù„",
  },
  en: {
    profile: "Profile",
    account: "Account",
    name: "Name",
    email: "Email",
    phone: "Phone",
    gender: "Gender",
    male: "Male",
    female: "Female",
    country: "Country",
    language: "Language",
    subscriptions: "Subscriptions",
    support: "Support",
    website: "KISHIB Website",
    cookies: "Cookies",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    logout: "Log out",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or Ø­Ø°Ù to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "Coming soon",
    paymentDisabled: "Payment is not enabled yet",
    unknown: "Not added",
    editProfile: "Edit profile",
    save: "Save",
    cancel: "Cancel",
    saved: "Saved",
    supportText: "For support and help, contact us by email",
    close: "Close",
    monthlyPlan: "Monthly subscription",
    annualPlan: "Annual subscription",
    reportsPack: "Reports package",
    price: "Price",
    includes: "Includes",
  },
  fr: {
    profile: "Profil",
    account: "Compte",
    name: "Nom",
    email: "E-mail",
    phone: "TÃ©lÃ©phone",
    gender: "Genre",
    male: "Homme",
    female: "Femme",
    country: "Pays",
    language: "Langue",
    subscriptions: "Abonnements",
    support: "Support",
    website: "Site KISHIB",
    cookies: "Cookies",
    terms: "Conditions",
    privacy: "ConfidentialitÃ©",
    logout: "DÃ©connexion",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or Ø­Ø°Ù to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "BientÃ´t",
    paymentDisabled: "Paiement non activÃ©",
    unknown: "Non ajoutÃ©",
    editProfile: "Modifier le profil",
    save: "Enregistrer",
    cancel: "Annuler",
    saved: "EnregistrÃ©",
    supportText: "Pour obtenir de l'aide, contactez-nous par e-mail",
    close: "Fermer",
    monthlyPlan: "Abonnement mensuel",
    annualPlan: "Abonnement annuel",
    reportsPack: "Pack de rapports",
    price: "Prix",
    includes: "Comprend",
  },
  hi: {
    profile: "à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤²",
    account: "à¤–à¤¾à¤¤à¤¾",
    name: "à¤¨à¤¾à¤®",
    email: "à¤ˆà¤®à¥‡à¤²",
    phone: "à¤«à¤¼à¥‹à¤¨",
    gender: "Gender",
    male: "Male",
    female: "Female",
    country: "à¤¦à¥‡à¤¶",
    language: "à¤­à¤¾à¤·à¤¾",
    subscriptions: "à¤¸à¤¦à¤¸à¥à¤¯à¤¤à¤¾",
    support: "Support",
    website: "KISHIB Website",
    cookies: "à¤•à¥à¤•à¥€à¤œà¤¼",
    terms: "à¤¨à¤¿à¤¯à¤® à¤”à¤° à¤¶à¤°à¥à¤¤à¥‡à¤‚",
    privacy: "à¤—à¥‹à¤ªà¤¨à¥€à¤¯à¤¤à¤¾ à¤¨à¥€à¤¤à¤¿",
    logout: "à¤²à¥‰à¤— à¤†à¤‰à¤Ÿ",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or Ø­Ø°Ù to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "à¤œà¤²à¥à¤¦",
    paymentDisabled: "à¤­à¥à¤—à¤¤à¤¾à¤¨ à¤…à¤­à¥€ à¤¸à¤•à¥à¤°à¤¿à¤¯ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ",
    unknown: "à¤œà¥‹à¤¡à¤¼à¤¾ à¤¨à¤¹à¥€à¤‚ à¤—à¤¯à¤¾",
    editProfile: "à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² à¤¸à¤‚à¤ªà¤¾à¤¦à¤¿à¤¤ à¤•à¤°à¥‡à¤‚",
    save: "à¤¸à¤¹à¥‡à¤œà¥‡à¤‚",
    cancel: "à¤°à¤¦à¥à¤¦ à¤•à¤°à¥‡à¤‚",
    saved: "à¤¸à¤¹à¥‡à¤œà¤¾ à¤—à¤¯à¤¾",
    supportText: "à¤¸à¤¹à¤¾à¤¯à¤¤à¤¾ à¤•à¥‡ à¤²à¤¿à¤ à¤¹à¤®à¥‡à¤‚ à¤ˆà¤®à¥‡à¤² à¤¸à¥‡ à¤¸à¤‚à¤ªà¤°à¥à¤• à¤•à¤°à¥‡à¤‚",
    close: "à¤¬à¤‚à¤¦ à¤•à¤°à¥‡à¤‚",
    monthlyPlan: "à¤®à¤¾à¤¸à¤¿à¤• à¤¸à¤¦à¤¸à¥à¤¯à¤¤à¤¾",
    annualPlan: "à¤µà¤¾à¤°à¥à¤·à¤¿à¤• à¤¸à¤¦à¤¸à¥à¤¯à¤¤à¤¾",
    reportsPack: "à¤°à¤¿à¤ªà¥‹à¤°à¥à¤Ÿ à¤ªà¥ˆà¤•à¥‡à¤œ",
    price: "à¤®à¥‚à¤²à¥à¤¯",
    includes: "à¤¶à¤¾à¤®à¤¿à¤²",
  },
  fa: {
    profile: "Ù¾Ø±ÙˆÙØ§ÛŒÙ„",
    account: "Ø­Ø³Ø§Ø¨",
    name: "Ù†Ø§Ù…",
    email: "Ø§ÛŒÙ…ÛŒÙ„",
    phone: "Ø´Ù…Ø§Ø±Ù‡ ØªÙ„ÙÙ†",
    gender: "جنسیت",
    male: "مرد",
    female: "زن",
    country: "Ú©Ø´ÙˆØ±",
    language: "Ø²Ø¨Ø§Ù†",
    subscriptions: "Ø§Ø´ØªØ±Ø§Ú©â€ŒÙ‡Ø§",
    support: "Ù¾Ø´ØªÛŒØ¨Ø§Ù†ÛŒ",
    website: "ÙˆØ¨â€ŒØ³Ø§ÛŒØª KISHIB",
    cookies: "Ú©ÙˆÚ©ÛŒâ€ŒÙ‡Ø§",
    terms: "Ø´Ø±Ø§ÛŒØ· Ùˆ Ù‚ÙˆØ§Ù†ÛŒÙ†",
    privacy: "Ø­Ø±ÛŒÙ… Ø®ØµÙˆØµÛŒ",
    logout: "Ø®Ø±ÙˆØ¬",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or Ø­Ø°Ù to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "Ø¨Ù‡â€ŒØ²ÙˆØ¯ÛŒ",
    paymentDisabled: "Ù¾Ø±Ø¯Ø§Ø®Øª ÙØ¹Ù„Ø§Ù‹ ÙØ¹Ø§Ù„ Ù†ÛŒØ³Øª",
    unknown: "Ø§Ø¶Ø§ÙÙ‡ Ù†Ø´Ø¯Ù‡",
    editProfile: "ÙˆÛŒØ±Ø§ÛŒØ´ Ù¾Ø±ÙˆÙØ§ÛŒÙ„",
    save: "Ø°Ø®ÛŒØ±Ù‡",
    cancel: "Ù„ØºÙˆ",
    saved: "Ø°Ø®ÛŒØ±Ù‡ Ø´Ø¯",
    supportText: "Ø¨Ø±Ø§ÛŒ Ù¾Ø´ØªÛŒØ¨Ø§Ù†ÛŒ Ùˆ Ú©Ù…Ú© Ø§Ø² Ø·Ø±ÛŒÙ‚ Ø§ÛŒÙ…ÛŒÙ„ Ø¨Ø§ Ù…Ø§ ØªÙ…Ø§Ø³ Ø¨Ú¯ÛŒØ±ÛŒØ¯",
    close: "Ø¨Ø³ØªÙ†",
    monthlyPlan: "Ø§Ø´ØªØ±Ø§Ú© Ù…Ø§Ù‡Ø§Ù†Ù‡",
    annualPlan: "Ø§Ø´ØªØ±Ø§Ú© Ø³Ø§Ù„Ø§Ù†Ù‡",
    reportsPack: "Ø¨Ø³ØªÙ‡ Ú¯Ø²Ø§Ø±Ø´â€ŒÙ‡Ø§",
    price: "Ù‚ÛŒÙ…Øª",
    includes: "Ø´Ø§Ù…Ù„",
  },
  tr: {
    profile: "Profil",
    account: "Hesap",
    name: "Ad",
    email: "E-posta",
    phone: "Telefon",
    gender: "Cinsiyet",
    male: "Erkek",
    female: "Kadın",
    country: "Ãœlke",
    language: "Dil",
    subscriptions: "Abonelikler",
    support: "Destek",
    website: "KISHIB Website",
    cookies: "Ã‡erezler",
    terms: "Åžartlar ve KoÅŸullar",
    privacy: "Gizlilik PolitikasÄ±",
    logout: "Ã‡Ä±kÄ±ÅŸ yap",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or Ø­Ø°Ù to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "YakÄ±nda",
    paymentDisabled: "Ã–deme ÅŸu anda etkin deÄŸil",
    unknown: "Eklenmedi",
    editProfile: "Profili dÃ¼zenle",
    save: "Kaydet",
    cancel: "Ä°ptal",
    saved: "Kaydedildi",
    supportText: "Destek ve yardÄ±m iÃ§in bize e-posta ile ulaÅŸÄ±n",
    close: "Kapat",
    monthlyPlan: "AylÄ±k abonelik",
    annualPlan: "YÄ±llÄ±k abonelik",
    reportsPack: "Rapor paketi",
    price: "Fiyat",
    includes: "Ä°Ã§erir",
  },
  ru: {
    profile: "ÐŸÑ€Ð¾Ñ„Ð¸Ð»ÑŒ",
    account: "ÐÐºÐºÐ°ÑƒÐ½Ñ‚",
    name: "Ð˜Ð¼Ñ",
    email: "Email",
    phone: "Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½",
    gender: "Пол",
    male: "Мужской",
    female: "Женский",
    country: "Ð¡Ñ‚Ñ€Ð°Ð½Ð°",
    language: "Ð¯Ð·Ñ‹Ðº",
    subscriptions: "ÐŸÐ¾Ð´Ð¿Ð¸ÑÐºÐ¸",
    support: "ÐŸÐ¾Ð´Ð´ÐµÑ€Ð¶ÐºÐ°",
    website: "KISHIB Website",
    cookies: "Cookies",
    terms: "Ð£ÑÐ»Ð¾Ð²Ð¸Ñ",
    privacy: "ÐŸÐ¾Ð»Ð¸Ñ‚Ð¸ÐºÐ° ÐºÐ¾Ð½Ñ„Ð¸Ð´ÐµÐ½Ñ†Ð¸Ð°Ð»ÑŒÐ½Ð¾ÑÑ‚Ð¸",
    logout: "Ð’Ñ‹Ð¹Ñ‚Ð¸",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or Ø­Ø°Ù to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "Ð¡ÐºÐ¾Ñ€Ð¾",
    paymentDisabled: "ÐžÐ¿Ð»Ð°Ñ‚Ð° Ð¿Ð¾ÐºÐ° Ð½Ðµ Ð²ÐºÐ»ÑŽÑ‡ÐµÐ½Ð°",
    unknown: "ÐÐµ Ð´Ð¾Ð±Ð°Ð²Ð»ÐµÐ½Ð¾",
    editProfile: "Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»ÑŒ",
    save: "Ð¡Ð¾Ñ…Ñ€Ð°Ð½Ð¸Ñ‚ÑŒ",
    cancel: "ÐžÑ‚Ð¼ÐµÐ½Ð°",
    saved: "Ð¡Ð¾Ñ…Ñ€Ð°Ð½ÐµÐ½Ð¾",
    supportText: "Ð”Ð»Ñ Ð¿Ð¾Ð´Ð´ÐµÑ€Ð¶ÐºÐ¸ Ð¸ Ð¿Ð¾Ð¼Ð¾Ñ‰Ð¸ ÑÐ²ÑÐ¶Ð¸Ñ‚ÐµÑÑŒ Ñ Ð½Ð°Ð¼Ð¸ Ð¿Ð¾ ÑÐ»ÐµÐºÑ‚Ñ€Ð¾Ð½Ð½Ð¾Ð¹ Ð¿Ð¾Ñ‡Ñ‚Ðµ",
    close: "Ð—Ð°ÐºÑ€Ñ‹Ñ‚ÑŒ",
    monthlyPlan: "ÐœÐµÑÑÑ‡Ð½Ð°Ñ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ°",
    annualPlan: "Ð“Ð¾Ð´Ð¾Ð²Ð°Ñ Ð¿Ð¾Ð´Ð¿Ð¸ÑÐºÐ°",
    reportsPack: "ÐŸÐ°ÐºÐµÑ‚ Ð¾Ñ‚Ñ‡ÐµÑ‚Ð¾Ð²",
    price: "Ð¦ÐµÐ½Ð°",
    includes: "Ð’ÐºÐ»ÑŽÑ‡Ð°ÐµÑ‚",
  },
  ku: {
    profile: "Ù¾Ø±Û†ÙØ§ÛŒÙ„",
    account: "Ù‡Û•Ú˜Ù…Ø§Ø±",
    name: "Ù†Ø§Ùˆ",
    email: "Ø¦ÛŒÙ…Û•ÛŒÙ„",
    phone: "Ú˜Ù…Ø§Ø±Û•ÛŒ ØªÛ•Ù„Û•ÙÛ†Ù†",
    gender: "ڕەگەز",
    male: "نێر",
    female: "مێ",
    country: "ÙˆÚµØ§Øª",
    language: "Ø²Ù…Ø§Ù†",
    subscriptions: "Ø¨Û•Ø´Ø¯Ø§Ø±Ø¨ÙˆÙˆÙ†Û•Ú©Ø§Ù†",
    support: "Ù¾Ø§ÚµÙ¾Ø´ØªÛŒ",
    website: "Ù…Ø§ÚµÙ¾Û•Ú•ÛŒ KISHIB",
    cookies: "Ú©ÙˆÚ©ÛŒØ²",
    terms: "Ù…Û•Ø±Ø¬ Ùˆ Ú•ÛŽØ³Ø§Ú©Ø§Ù†",
    privacy: "ØªØ§ÛŒØ¨Û•ØªÙ…Û•Ù†Ø¯ÛŒ",
    logout: "Ú†ÙˆÙˆÙ†Û•Ø¯Û•Ø±Û•ÙˆÛ•",
    deleteAccount: "Delete account",
    deleteAccountTitle: "Delete account",
    deleteAccountWarning: "This action is permanent and cannot be undone.",
    deleteAccountDataWarning: "Your account, profile data, evaluation history, uploaded images, and notes associated with your account will be deleted as much as possible.",
    deleteAccountConfirmHint: "Type DELETE or Ø­Ø°Ù to enable deletion.",
    deleteAccountConfirmButton: "Delete account permanently",
    deleteAccountSuccess: "Account and associated data were deleted successfully.",
    deleteAccountFailed: "Unable to delete account. Please try again.",
    comingSoon: "Ø¨Û•Ù… Ø²ÙˆÙˆØ§Ù†Û•",
    paymentDisabled: "Ù¾Ø§Ø±Û•Ø¯Ø§Ù† Ù„Û• Ø¦ÛŽØ³ØªØ§Ø¯Ø§ Ú†Ø§Ù„Ø§Ú© Ù†ÛŒÛŒÛ•",
    unknown: "Ø²ÛŒØ§Ø¯ Ù†Û•Ú©Ø±Ø§ÙˆÛ•",
    editProfile: "Ø¯Û•Ø³ØªÚ©Ø§Ø±ÛŒ Ù¾Ø±Û†ÙØ§ÛŒÙ„",
    save: "Ù¾Ø§Ø´Û•Ú©Û•ÙˆØª",
    cancel: "Ù‡Û•ÚµÙˆÛ•Ø´Ø§Ù†Ø¯Ù†Û•ÙˆÛ•",
    saved: "Ù¾Ø§Ø´Û•Ú©Û•ÙˆØª Ú©Ø±Ø§",
    supportText: "Ø¨Û† Ù¾Ø§ÚµÙ¾Ø´ØªÛŒ Ùˆ ÛŒØ§Ø±Ù…Û•ØªÛŒ Ù„Û• Ú•ÛŽÚ¯Û•ÛŒ Ø¦ÛŒÙ…Û•ÛŒÙ„ Ù¾Û•ÛŒÙˆÛ•Ù†Ø¯ÛŒÙ…Ø§Ù† Ù¾ÛŽÙˆÛ• Ø¨Ú©Û•",
    close: "Ø¯Ø§Ø®Ø³ØªÙ†",
    monthlyPlan: "Ø¨Û•Ø´Ø¯Ø§Ø±Ø¨ÙˆÙˆÙ†ÛŒ Ù…Ø§Ù†Ú¯Ø§Ù†Û•",
    annualPlan: "Ø¨Û•Ø´Ø¯Ø§Ø±Ø¨ÙˆÙˆÙ†ÛŒ Ø³Ø§ÚµØ§Ù†Û•",
    reportsPack: "Ù¾Ø§Ú©ÛŽØ¬ÛŒ Ú•Ø§Ù¾Û†Ø±ØªÛ•Ú©Ø§Ù†",
    price: "Ù†Ø±Ø®",
    includes: "Ù„Û•Ø®Û†Ø¯Û•Ú¯Ø±ÛŽØª",
  },
};

const MENU_LANGUAGES: { code: Locale; label: string; short: string }[] = [
  { code: "ar", label: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©", short: "AR" },
  { code: "en", label: "English", short: "EN" },
  { code: "fa", label: "ÙØ§Ø±Ø³ÛŒ", short: "FA" },
  { code: "tr", label: "TÃ¼rkÃ§e", short: "TR" },
  { code: "fr", label: "FranÃ§ais", short: "FR" },
  { code: "hi", label: "à¤¹à¤¿à¤¨à¥à¤¦à¥€", short: "HI" },
  { code: "ku", label: "KurdÃ®", short: "KU" },
  { code: "ru", label: "Ð ÑƒÑÑÐºÐ¸Ð¹", short: "RU" },
];

function isRtl(locale: Locale) {
  return locale === "ar" || locale === "fa" || locale === "ku";
}

function getInitial(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "K";
  return source.charAt(0).toUpperCase();
}

function getFallbackName(email?: string | null) {
  if (!email) return "KISHIB user";
  return email.split("@")[0] || "KISHIB user";
}

function readMetadataText(metadata: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function readCachedProfile(userId: string): EditableProfile | null {
  if (typeof window === "undefined" || !userId) return null;

  try {
    const raw = window.localStorage.getItem(`${PROFILE_CACHE_PREFIX}${userId}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<EditableProfile>;

    return {
      name: typeof parsed.name === "string" ? parsed.name : "",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      gender: typeof parsed.gender === "string" ? parsed.gender : "",
      country: typeof parsed.country === "string" ? parsed.country : "",
      countryCode:
        typeof parsed.countryCode === "string" ? parsed.countryCode : "",
      provinceCode:
        typeof parsed.provinceCode === "string" ? parsed.provinceCode : "",
      city: typeof parsed.city === "string" ? parsed.city : "",
    };
  } catch {
    return null;
  }
}

function cacheProfile(userId: string, profile: EditableProfile) {
  if (typeof window === "undefined" || !userId) return;
  window.localStorage.setItem(
    `${PROFILE_CACHE_PREFIX}${userId}`,
    JSON.stringify(profile),
  );
}

function buildProfileInfo(
  user: {
    id?: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
  } | null,
  profile?: UserProfile | null,
): ProfileInfo | null {
  if (!user) return null;

  const metadata = user.user_metadata ?? {};
  const userId = user.id || "";
  const cached = readCachedProfile(userId);
  const email = user.email || "";
  const metadataName = readMetadataText(metadata, [
    "full_name",
    "name",
    "display_name",
  ]);
  const normalizedCountry =
    getCountryByCode(profile?.country_code) ||
    normalizeCountry(profile?.country || cached?.country || readMetadataText(metadata, ["country_code", "country", "country_name"]));
  const normalizedProvince =
    getProvinceByCode(profile?.province_code) ||
    normalizeProvince(profile?.province || profile?.city || cached?.city || readMetadataText(metadata, ["province_code", "city", "province", "governorate"]));

  return {
    userId,
    name: profile?.full_name || cached?.name || metadataName || getFallbackName(email),
    email: profile?.email || email,
    phone:
      profile?.phone ||
      cached?.phone ||
      readMetadataText(metadata, ["phone", "phone_number", "mobile"]),
    gender:
      profile?.gender ||
      cached?.gender ||
      readMetadataText(metadata, ["gender"]),
    country:
      normalizedCountry?.nameEn ||
      profile?.country ||
      cached?.country ||
      readMetadataText(metadata, ["country", "country_name"]),
    countryCode: normalizedCountry?.code || "",
    city:
      normalizedProvince?.nameEn ||
      profile?.city ||
      profile?.province ||
      cached?.city ||
      readMetadataText(metadata, ["city", "province", "governorate"]),
    provinceCode: normalizedProvince?.code || "",
    avatarUrl:
      profile?.avatar_url ||
      readMetadataText(metadata, ["avatar_url", "picture", "photo_url"]),
  };
}

function isProfileIncomplete(profile: ProfileInfo | null) {
  return (
    !profile?.name?.trim() ||
    !profile.phone.trim() ||
    !profile.gender.trim() ||
    !profile.countryCode.trim() ||
    (profile.countryCode === "IQ" && !profile.provinceCode.trim())
  );
}

function getGenderLabel(value: string | undefined, copy: MenuCopy) {
  if (value === "male") return copy.male;
  if (value === "female") return copy.female;
  return copy.unknown;
}

function Avatar({
  name,
  email,
  avatarUrl,
  className,
}: {
  name: string;
  email: string;
  avatarUrl?: string;
  className?: string;
}) {
  const initial = getInitial(name, email);
  const baseClass = [
    "grid place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#dcc18a] via-[#b88a3d] to-[#6d241d] font-bold text-[#fff4e2] ring-1 ring-[#b88a3d]/25",
    className || "",
  ].join(" ");

  if (avatarUrl) {
    return (
      <span className={baseClass}>
        <img
          src={avatarUrl}
          alt={name || email || "KISHIB user"}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </span>
    );
  }

  return <span className={baseClass}>{initial}</span>;
}

export default function UserMenu({
  locale,
  setLocale,
  compact = false,
}: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [profileInfo, setProfileInfo] = useState<ProfileInfo | null>(null);
  const [formProfile, setFormProfile] = useState<EditableProfile>({
    name: "",
    phone: "",
    gender: "",
    country: "",
    countryCode: "",
    provinceCode: "",
    city: "",
  });
  const menuRef = useRef<HTMLDivElement | null>(null);
const panelRef = useRef<HTMLDivElement | null>(null);
  const copy = COPY[locale];
  const rtl = isRtl(locale);
  const activeLanguage =
    MENU_LANGUAGES.find((item) => item.code === locale) ?? MENU_LANGUAGES[0];

  const displayName = profileInfo?.name || getFallbackName(profileInfo?.email);
  const displayEmail = profileInfo?.email || copy.unknown;
  const avatarUrl = profileInfo?.avatarUrl || "";
  const profileIncomplete = isProfileIncomplete(profileInfo);
  const provinceLabel =
    copy.province || (locale === "ar" ? "Ø§Ù„Ù…Ø¯ÙŠÙ†Ø© / Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©" : "City / Province");
  const canConfirmAccountDeletion =
    deleteConfirmation.trim().toUpperCase() === "DELETE" ||
    deleteConfirmation.trim() === "Ø­Ø°Ù";

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    async function loadUser() {
      const { user, profile } = await getCurrentUserProfile();

      if (!mounted) return;

      const nextProfile = buildProfileInfo(user, profile);
      setProfileInfo(nextProfile);
      if (nextProfile) {
        setFormProfile({
          name: nextProfile.name,
          phone: nextProfile.phone,
          gender: nextProfile.gender,
          country: nextProfile.country,
          countryCode: nextProfile.countryCode,
          provinceCode: nextProfile.provinceCode,
          city: nextProfile.city,
        });
        setEditOpen(isProfileIncomplete(nextProfile));
      }
    }

    void loadUser();

    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = supabase.auth.onAuthStateChange(() => {
        if (!mounted) return;
        void loadUser();
      });

      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      unsubscribe = undefined;
    }

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadUpdatedProfile() {
      const { user, profile } = await getCurrentUserProfile();
      if (!mounted) return;

      const nextProfile = buildProfileInfo(user, profile);
      setProfileInfo(nextProfile);
      if (nextProfile) {
        setFormProfile({
          name: nextProfile.name,
          phone: nextProfile.phone,
          gender: nextProfile.gender,
          country: nextProfile.country,
          countryCode: nextProfile.countryCode,
          provinceCode: nextProfile.provinceCode,
          city: nextProfile.city,
        });
      }
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, loadUpdatedProfile);

    return () => {
      mounted = false;
      window.removeEventListener(PROFILE_UPDATED_EVENT, loadUpdatedProfile);
    };
  }, []);

  useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;

  if (menuRef.current?.contains(target)) return;
  if (panelRef.current?.contains(target)) return;

  setIsOpen(false);
  setLanguageOpen(false);
}

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    window.localStorage.removeItem(AUTH_CACHE_KEY);
    window.location.reload();
  }

  function clearLocalAccountData(userId?: string) {
    if (typeof window === "undefined") return;

    const keysToRemove = [
      AUTH_CACHE_KEY,
      "kishib:supabase-auth",
      "antiques-lens:history-v2",
      "antiques-lens:history",
      "kishib-history",
      "antique-history",
      "antiqueLensHistory",
      "history",
      "archive",
      "kishib:pending-oauth-locale",
    ];

    keysToRemove.forEach((key) => window.localStorage.removeItem(key));

    if (userId) {
      window.localStorage.removeItem(`${PROFILE_CACHE_PREFIX}${userId}`);
    }

    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(PROFILE_CACHE_PREFIX)) {
        window.localStorage.removeItem(key);
      }
    }

    window.sessionStorage.clear();

    if (typeof indexedDB !== "undefined") {
      indexedDB.deleteDatabase("kishib-archive-images");
    }
  }

  function closeDeleteDialog() {
    if (deletingAccount) return;

    setDeleteOpen(false);
    setDeleteConfirmation("");
    setDeleteError("");
  }

  async function handleDeleteAccount() {
    const normalizedConfirmation = deleteConfirmation.trim().toUpperCase();

    if (
      normalizedConfirmation !== "DELETE" &&
      deleteConfirmation.trim() !== "Ø­Ø°Ù"
    ) {
      return;
    }

    setDeletingAccount(true);
    setDeleteError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      const userId = data.session?.user.id || profileInfo?.userId;

      if (error || !accessToken) {
        throw new Error("No active session.");
      }

      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : copy.deleteAccountFailed,
        );
      }

      await supabase.auth.signOut();
      clearLocalAccountData(userId);
      window.alert(copy.deleteAccountSuccess);
      window.location.href = "/";
    } catch (error) {
      console.error("delete account error:", error);
      setDeleteError(copy.deleteAccountFailed);
    } finally {
      setDeletingAccount(false);
    }
  }

  async function handleProfileSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profileInfo) return;

    const nextProfile = {
      name: formProfile.name.trim(),
      phone: formProfile.phone.trim(),
      gender: formProfile.gender.trim(),
      country: formProfile.country.trim(),
      countryCode: formProfile.countryCode.trim(),
      provinceCode: formProfile.provinceCode.trim(),
      city: formProfile.city.trim(),
    };

    setSaving(true);
    setSaveMessage("");

    try {
      cacheProfile(profileInfo.userId, nextProfile);

      const { profile } = await updateCurrentUserProfile({
        full_name: nextProfile.name,
        phone: nextProfile.phone,
        gender: nextProfile.gender,
        country: nextProfile.country,
        country_code: nextProfile.countryCode,
        province_code: nextProfile.provinceCode,
        city: nextProfile.city,
      });

      setProfileInfo(
        buildProfileInfo(
          {
            id: profileInfo.userId,
            email: profileInfo.email,
            user_metadata: {
              full_name: nextProfile.name,
              phone: nextProfile.phone,
              gender: nextProfile.gender,
              country: nextProfile.country,
              country_code: nextProfile.countryCode,
              province_code: nextProfile.provinceCode,
              city: nextProfile.city,
            },
          },
          profile,
        ) ?? {
          ...profileInfo,
          ...nextProfile,
        },
      );
      setEditOpen(false);
      setSaveMessage(copy.saved);
    } catch {
      setProfileInfo((current) =>
        current ? { ...current, ...nextProfile } : current,
      );
      setEditOpen(false);
      setSaveMessage(copy.saved);
    } finally {
      setSaving(false);
    }
  }

  function openPanel(panel: "support" | "plans" | "delete") {
    setLanguageOpen(false);
    setSupportOpen(panel === "support");
    setPlansOpen(panel === "plans");
    setDeleteOpen(panel === "delete");
    setDeleteConfirmation("");
    setDeleteError("");
  }

  function openKishibWebsite() {
    setIsOpen(false);
    window.open(KISHIB_WEBSITE_URL, "_blank", "noopener,noreferrer");
  }

  return (
    <div ref={menuRef} dir={rtl ? "rtl" : "ltr"} className="relative z-50">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={[
          "grid place-items-center rounded-full border border-[#d2b98f] bg-[#fff4e2]/88 text-[#241913] shadow-[0_14px_38px_rgba(62,39,22,0.14)] backdrop-blur-2xl transition hover:border-[#b88a3d]/55 hover:bg-[#fff4e2]",
          compact ? "h-8 w-8" : "h-11 w-11",
        ].join(" ")}
        aria-label={copy.profile}
      >
        <Avatar
          name={displayName}
          email={displayEmail}
          avatarUrl={avatarUrl}
          className={compact ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs"}
        />
      </button>

      {isOpen && typeof document !== "undefined"
  ? createPortal(
      <>
        <button
          type="button"
          aria-label="Close user menu"
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[9998] bg-[#241913]/20 backdrop-blur-[2px]"
        />

        <div
          ref={panelRef}
          className={[
            "fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+12px)] z-[9999] overflow-hidden rounded-[22px] border border-[#d2b98f] bg-[#fff4e2]/96 shadow-[0_26px_82px_rgba(62,39,22,0.18)] backdrop-blur-2xl",
              compact
                ? "h-[54dvh] min-h-[310px] max-h-[430px]"
                : "h-[78dvh] min-h-[360px] max-h-[620px]",
              "md:inset-x-auto md:bottom-auto md:top-16 md:h-auto md:max-h-[calc(100dvh-5rem)] md:w-[350px] md:rounded-[1.25rem]",
              rtl ? "md:left-4" : "md:right-4",
            ].join(" ")}
          >
            <div className="flex h-full flex-col overflow-y-auto p-3">
              <div className="rounded-[16px] border border-[#d2b98f] bg-[#efe3cf]/70 p-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={displayName}
                    email={displayEmail}
                    avatarUrl={avatarUrl}
                    className="h-10 w-10 shrink-0 rounded-2xl text-sm"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[#241913]">
                      {displayName}
                    </p>
                    <p className="truncate text-[11px] text-[#735f4b]">
                      {displayEmail || copy.account}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-1.5">
                  <ProfileLine
                    icon={<Mail className="h-3.5 w-3.5" />}
                    label={copy.email}
                    value={displayEmail}
                  />
                  <ProfileLine
                    icon={<Phone className="h-3.5 w-3.5" />}
                    label={copy.phone}
                    value={profileInfo?.phone || copy.unknown}
                  />
                  <ProfileLine
                    icon={<Users className="h-3.5 w-3.5" />}
                    label={copy.gender}
                    value={getGenderLabel(profileInfo?.gender, copy)}
                  />
                  <ProfileLine
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label={copy.country}
                    value={profileInfo?.country || copy.unknown}
                  />
                  <ProfileLine
                    icon={<MapPin className="h-3.5 w-3.5" />}
                    label={provinceLabel}
                    value={profileInfo?.city || copy.unknown}
                  />
                </div>

                {profileIncomplete || saveMessage ? (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setEditOpen((current) => !current)}
                      className="h-8 rounded-[10px] border border-[#b88a3d]/35 bg-[#fff4e2]/70 px-3 text-[11px] font-semibold text-[#6d241d] transition hover:bg-[#fff4e2]"
                    >
                      {copy.editProfile}
                    </button>
                    {saveMessage ? (
                      <span className="text-[10.5px] font-medium text-[#2f6d3a]">
                        {saveMessage}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditOpen((current) => !current)}
                    className="mt-2 h-8 rounded-[10px] px-2 text-[11px] font-semibold text-[#6d241d] transition hover:bg-[#d9b59e]/45"
                  >
                    {copy.editProfile}
                  </button>
                )}
              </div>

              {editOpen ? (
                <form
                  onSubmit={(event) => void handleProfileSave(event)}
                  className="mt-2 rounded-[16px] border border-[#d2b98f] bg-[#fff4e2]/65 p-3"
                >
                  <ProfileInput
                    label={copy.name}
                    value={formProfile.name}
                    onChange={(value) =>
                      setFormProfile((current) => ({ ...current, name: value }))
                    }
                    autoComplete="name"
                  />
                  <ProfileInput
                    label={copy.phone}
                    value={formProfile.phone}
                    onChange={(value) =>
                      setFormProfile((current) => ({ ...current, phone: value }))
                    }
                    autoComplete="tel"
                  />
                  <ProfileSelect
                    label={copy.gender}
                    value={formProfile.gender}
                    onChange={(value) =>
                      setFormProfile((current) => ({ ...current, gender: value }))
                    }
                    options={[
                      { value: "male", label: copy.male },
                      { value: "female", label: copy.female },
                    ]}
                  />
                  <ProfileSelect
                    label={copy.country}
                    value={formProfile.countryCode}
                    onChange={(value) => {
                      const selectedCountry = getCountryByCode(value);
                      setFormProfile((current) => ({
                        ...current,
                        countryCode: value,
                        country: selectedCountry?.nameEn || "",
                        provinceCode:
                          value === "IQ" ? current.provinceCode : "",
                        city: value === "IQ" ? current.city : "",
                      }));
                    }}
                    options={countries.map((country) => ({
                      value: country.code,
                      label: countryLabel(country, locale),
                    }))}
                  />
                  {formProfile.countryCode === "IQ" ? (
                    <ProfileSelect
                      label={provinceLabel}
                      value={formProfile.provinceCode}
                      onChange={(value) => {
                        const selectedProvince = getProvinceByCode(value);
                        setFormProfile((current) => ({
                          ...current,
                          provinceCode: value,
                          city: selectedProvince?.nameEn || "",
                        }));
                      }}
                      options={iraqProvinces.map((province) => ({
                        value: province.code,
                        label: getProvinceOptionLabel(province, locale),
                      }))}
                    />
                  ) : null}

                  <div className="mt-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="h-9 flex-1 rounded-[11px] bg-[#6d241d] px-3 text-[11.5px] font-semibold text-[#fff4e2] transition hover:bg-[#7d2d23] disabled:opacity-60"
                    >
                      {saving ? `${copy.save}...` : copy.save}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditOpen(false)}
                      className="h-9 flex-1 rounded-[11px] border border-[#d2b98f] px-3 text-[11.5px] font-semibold text-[#735f4b] transition hover:bg-[#efe3cf]"
                    >
                      {copy.cancel}
                    </button>
                  </div>
                </form>
              ) : null}

              {setLocale ? (
                <div className="relative mt-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
                  <button
                    type="button"
                    onClick={() => setLanguageOpen((current) => !current)}
                    className="flex h-9 w-full items-center gap-3 rounded-[11px] px-2.5 text-start transition hover:bg-[#d9b59e]/55"
                    aria-expanded={languageOpen}
                  >
                    <span className="text-[#986f2e]">
                      <Globe2 className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-[12px] font-medium text-[#241913]">
                      {copy.language}
                    </span>
                    <span className="flex items-center gap-2 text-[10.5px] font-semibold text-[#735f4b]">
                      {activeLanguage.label}
                      <ChevronDown
                        className={[
                          "h-3.5 w-3.5 transition",
                          languageOpen ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </span>
                  </button>

                  {languageOpen ? (
                    <div className="absolute inset-x-1.5 top-12 z-10 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2] p-1.5 shadow-[0_18px_48px_rgba(62,39,22,0.16)]">
                      <div className="grid max-h-[232px] grid-cols-1 gap-1 overflow-y-auto">
                        {MENU_LANGUAGES.map((item) => {
                          const active = item.code === locale;

                          return (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => {
                                setLocale(item.code);
                                setLanguageOpen(false);
                              }}
                              className={[
                                "flex h-8 items-center gap-2 rounded-[10px] px-2 text-start text-[11px] transition",
                                active
                                  ? "bg-[#b88a3d] text-[#fff4e2]"
                                  : "text-[#735f4b] hover:bg-[#d9b59e]/55 hover:text-[#241913]",
                              ].join(" ")}
                            >
                              <span
                                className={[
                                  "grid h-5 w-7 shrink-0 place-items-center rounded-lg text-[9px] font-semibold",
                                  active
                                    ? "bg-[#fff4e2]/20 text-[#fff4e2]"
                                    : "border border-[#d2b98f] text-[#735f4b]",
                                ].join(" ")}
                              >
                                {item.short}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-medium">
                                {item.label}
                              </span>
                              {active ? <Check className="h-3.5 w-3.5" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div className="mt-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
                <MenuButton
                  icon={<Crown className="h-4 w-4" />}
                  label={copy.subscriptions}
                  value={copy.paymentDisabled}
                  onClick={() => openPanel("plans")}
                />
                <MenuButton
                  icon={<LifeBuoy className="h-4 w-4" />}
                  label={copy.support}
                  value={SUPPORT_EMAIL}
                  onClick={() => openPanel("support")}
                />
              </div>

              <div className="mt-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
                <MenuExternalButton
                  icon={<ExternalLink className="h-4 w-4" />}
                  label={copy.website}
                  onClick={openKishibWebsite}
                />
                <MenuLink
                  href="/cookies"
                  icon={<Cookie className="h-4 w-4" />}
                  label={copy.cookies}
                />
                <MenuLink
                  href="/terms"
                  icon={<FileText className="h-4 w-4" />}
                  label={copy.terms}
                />
                <MenuLink
                  href="/privacy"
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label={copy.privacy}
                />
              </div>

              <div className="mt-2 rounded-[14px] border border-[#d2b98f] bg-[#fff4e2]/55 p-1.5">
                <MenuButton
                  icon={<Trash2 className="h-4 w-4" />}
                  label={copy.deleteAccount}
                  value=""
                  danger
                  onClick={() => openPanel("delete")}
                />
              </div>

              <button
                type="button"
                onClick={() => void handleLogout()}
                className="mt-2 flex h-10 w-full items-center gap-3 rounded-[12px] px-3 text-start text-[12px] font-medium text-[#6d241d] transition hover:bg-[#d9b59e]/55"
              >
                <LogOut className="h-4 w-4 text-[#a35a44]" />
                <span className="flex-1">{copy.logout}</span>
              </button>
            </div>

            {supportOpen ? (
              <MenuModal title={copy.support} closeLabel={copy.close} onClose={() => setSupportOpen(false)}>
                <p className="text-[12px] leading-5 text-[#735f4b]">
                  {copy.supportText}
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="mt-3 flex h-10 items-center justify-center rounded-[12px] border border-[#b88a3d]/35 bg-[#efe3cf]/75 text-[12px] font-semibold text-[#6d241d]"
                >
                  {SUPPORT_EMAIL}
                </a>
              </MenuModal>
            ) : null}

            {plansOpen ? (
              <MenuModal title={copy.subscriptions} closeLabel={copy.close} onClose={() => setPlansOpen(false)}>
                <div className="grid gap-2">
                  <PlanCard
                    title={copy.monthlyPlan}
                    price="5$"
                    copy={copy}
                    features={["Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø´Ù‡Ø±ÙŠ", "Ø¥Ù…ÙƒØ§Ù†ÙŠØ© Ø·Ø¨Ø§Ø¹Ø© 5 ØªÙ‚Ø§Ø±ÙŠØ±"]}
                  />
                  <PlanCard
                    title={copy.annualPlan}
                    price="45$"
                    copy={copy}
                    features={["Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø³Ù†ÙˆÙŠ", "75 ØªÙ‚Ø±ÙŠØ± Ù‚Ø§Ø¨Ù„ Ù„Ù„Ø·Ø¨Ø§Ø¹Ø©"]}
                  />
                  <PlanCard
                    title={copy.reportsPack}
                    price="20$"
                    copy={copy}
                    features={[
                      "150 ØªÙ‚Ø±ÙŠØ±",
                      "ÙŠÙ…ÙƒÙ† Ø´Ø±Ø§Ø¤Ù‡Ø§ Ø¨Ø´ÙƒÙ„ Ù…Ù†ÙØµÙ„ Ø¹Ù† Ø§Ù„Ø§Ø´ØªØ±Ø§Ùƒ",
                    ]}
                  />
                </div>
              </MenuModal>
            ) : null}

            {deleteOpen ? (
              <MenuModal
                title={copy.deleteAccountTitle}
                closeLabel={copy.close}
                onClose={closeDeleteDialog}
              >
                <div className="rounded-[14px] border border-[#a23b2a]/25 bg-[#fff2ed] p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#a23b2a]" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-bold text-[#8f2e24]">
                        {copy.deleteAccountWarning}
                      </p>
                      <p className="mt-2 text-[11.5px] leading-5 text-[#735f4b]">
                        {copy.deleteAccountDataWarning}
                      </p>
                    </div>
                  </div>
                </div>

                <label className="mt-3 block">
                  <span className="mb-1 block text-[10.5px] font-semibold text-[#735f4b]">
                    {copy.deleteAccountConfirmHint}
                  </span>
                  <input
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    disabled={deletingAccount}
                    autoCapitalize="characters"
                    className="h-10 w-full rounded-[11px] border border-[#d2b98f] bg-[#fffaf0] px-3 text-[12px] font-semibold text-[#241913] outline-none transition focus:border-[#a23b2a] focus:ring-2 focus:ring-[#a23b2a]/18 disabled:opacity-60"
                  />
                </label>

                {deleteError ? (
                  <p className="mt-2 rounded-[10px] bg-[#fff2ed] px-3 py-2 text-[11px] font-semibold text-[#8f2e24]">
                    {deleteError}
                  </p>
                ) : null}

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={closeDeleteDialog}
                    disabled={deletingAccount}
                    className="h-10 flex-1 rounded-[11px] border border-[#d2b98f] px-3 text-[11.5px] font-semibold text-[#735f4b] transition hover:bg-[#efe3cf] disabled:opacity-60"
                  >
                    {copy.cancel}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteAccount()}
                    disabled={!canConfirmAccountDeletion || deletingAccount}
                    className="h-10 flex-1 rounded-[11px] bg-[#8f2e24] px-3 text-[11.5px] font-semibold text-[#fff4e2] transition hover:bg-[#a23b2a] disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    {deletingAccount
                      ? `${copy.deleteAccountConfirmButton}...`
                      : copy.deleteAccountConfirmButton}
                  </button>
                </div>
              </MenuModal>
            ) : null}
               </div>
        </>,
      document.body,
    )
  : null}
    </div>
  );
}

function ProfileLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex h-7 items-center gap-2 rounded-[10px] bg-[#fff4e2]/42 px-2">
      <span className="text-[#986f2e]">{icon}</span>
      <span className="w-16 shrink-0 text-[10.5px] font-medium text-[#735f4b]">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-[#241913]/78">
        {value}
      </span>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  return (
    <label className="mb-2 block">
      <span className="mb-1 block text-[10.5px] font-semibold text-[#735f4b]">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
        className="h-9 w-full rounded-[11px] border border-[#d2b98f] bg-[#fffaf0] px-3 text-[12px] font-medium text-[#241913] outline-none transition focus:border-[#b88a3d] focus:ring-2 focus:ring-[#b88a3d]/18"
      />
    </label>
  );
}

function ProfileSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="mb-2 block">
      <span className="mb-1 block text-[10.5px] font-semibold text-[#735f4b]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required
        className="h-9 w-full rounded-[11px] border border-[#d2b98f] bg-[#fffaf0] px-3 text-[12px] font-medium text-[#241913] outline-none transition focus:border-[#b88a3d] focus:ring-2 focus:ring-[#b88a3d]/18"
      >
        <option value="" className="bg-[#fff4e2] text-[#241913]">
          {label}
        </option>
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#fff4e2] text-[#241913]"
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function MenuButton({
  icon,
  label,
  value,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-full items-center gap-3 rounded-[12px] px-2.5 text-start transition hover:bg-[#d9b59e]/55"
    >
      <span className={danger ? "text-[#a23b2a]" : "text-[#986f2e]"}>
        {icon}
      </span>
      <span
        className={[
          "flex-1 text-[12px] font-medium",
          danger ? "text-[#8f2e24]" : "text-[#241913]",
        ].join(" ")}
      >
        {label}
      </span>
      <span className="max-w-[132px] truncate text-[10.5px] font-medium text-[#735f4b]">
        {value}
      </span>
    </button>
  );
}

function MenuModal({
  title,
  closeLabel,
  onClose,
  children,
}: {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-20 bg-[#241913]/18 p-3 backdrop-blur-[2px]">
      <div className="flex max-h-full flex-col rounded-[18px] border border-[#d2b98f] bg-[#fff4e2] p-3 shadow-[0_18px_60px_rgba(62,39,22,0.18)]">
        <div className="mb-3 flex items-center gap-3">
          <h3 className="min-w-0 flex-1 truncate text-[14px] font-bold text-[#241913]">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeLabel}
            className="grid h-8 w-8 place-items-center rounded-full border border-[#d2b98f] text-[#735f4b] transition hover:bg-[#efe3cf]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function PlanCard({
  title,
  price,
  copy,
  features,
}: {
  title: string;
  price: string;
  copy: MenuCopy;
  features: string[];
}) {
  return (
    <section className="rounded-[14px] border border-[#d2b98f] bg-[#fffaf0] p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="truncate text-[13px] font-bold text-[#241913]">
            {title}
          </h4>
          <p className="mt-0.5 text-[11px] font-semibold text-[#986f2e]">
            {copy.price}: {price}
          </p>
        </div>
        <span className="rounded-full bg-[#efe3cf] px-2 py-1 text-[10px] font-semibold text-[#6d241d]">
          {copy.comingSoon}
        </span>
      </div>
      <p className="mt-2 text-[10.5px] font-semibold text-[#735f4b]">
        {copy.includes}
      </p>
      <ul className="mt-1 grid gap-1">
        {features.map((feature) => (
          <li
            key={feature}
            className="flex items-start gap-2 text-[11px] leading-4 text-[#241913]/78"
          >
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#986f2e]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        disabled
        className="mt-3 h-9 w-full cursor-not-allowed rounded-[11px] border border-[#d2b98f] bg-[#efe3cf]/65 text-[11.5px] font-semibold text-[#735f4b]"
      >
        {copy.paymentDisabled}
      </button>
    </section>
  );
}

function MenuLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex h-9 w-full items-center gap-3 rounded-[12px] px-2.5 text-start transition hover:bg-[#d9b59e]/55"
    >
      <span className="text-[#986f2e]">{icon}</span>
      <span className="flex-1 text-[12px] font-medium text-[#241913]">
        {label}
      </span>
      <BadgeCheck className="h-3.5 w-3.5 text-[#735f4b]/45" />
    </Link>
  );
}

function MenuExternalButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-full items-center gap-3 rounded-[12px] px-2.5 text-start transition hover:bg-[#d9b59e]/55"
    >
      <span className="text-[#986f2e]">{icon}</span>
      <span className="flex-1 text-[12px] font-medium text-[#241913]">
        {label}
      </span>
      <ExternalLink className="h-3.5 w-3.5 text-[#735f4b]/45" />
    </button>
  );
}
