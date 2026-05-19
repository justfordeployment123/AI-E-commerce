"use client";

import React, { useState } from "react";
import { notFound, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Smartphone, Laptop, Tablet, Gamepad2, Headphones,
  ChevronDown, ShoppingCart, Star, Check,
  ArrowLeft, ArrowRight, ShieldCheck, Zap, RefreshCw, X, SlidersHorizontal,
  Battery, Camera, Monitor, Wifi, Cpu
} from "lucide-react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";

// ─── Category meta ──────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, {
  label: string;
  plural: string;
  icon: React.ElementType;
  mood: string;
  description: string;
  filters: string[];
  brands: string[];
}> = {
  phones: {
    label: "Phones",
    plural: "Smartphones",
    icon: Smartphone,
    mood: "bg-blue-50 text-blue-900 border-blue-200",
    description: "Certified refurbished smartphones with 2-year warranty. Every handset is unlocked, tested, and backed by our quality guarantee.",
    filters: ["Apple", "Samsung", "Google", "OnePlus"],
    brands: ["Apple", "Samsung", "Google", "OnePlus", "Nothing"],
  },
  tablets: {
    label: "Tablets",
    plural: "Tablets",
    icon: Tablet,
    mood: "bg-rose-50 text-rose-900 border-rose-200",
    description: "Refurbished iPads, Samsung Galaxy Tabs and Surface devices. Fully tested, screen checked, and sold with a 2-year warranty.",
    filters: ["Apple", "Samsung", "Microsoft"],
    brands: ["Apple", "Samsung", "Microsoft"],
  },
  consoles: {
    label: "Consoles",
    plural: "Gaming Consoles",
    icon: Gamepad2,
    mood: "bg-violet-50 text-violet-900 border-violet-200",
    description: "Certified refurbished PlayStation, Xbox and Nintendo consoles. Disc drives tested, HDMI verified, controllers included.",
    filters: ["Sony", "Microsoft", "Nintendo"],
    brands: ["Sony", "Microsoft", "Nintendo"],
  },
  laptops: {
    label: "Laptops",
    plural: "Laptops & MacBooks",
    icon: Laptop,
    mood: "bg-amber-50 text-amber-900 border-amber-200",
    description: "Refurbished MacBooks, ThinkPads, Dell XPS and more. Every laptop is battery-tested, keyboard-checked, and ships with a warranty.",
    filters: ["Apple", "Dell", "Lenovo", "HP"],
    brands: ["Apple", "Dell", "Lenovo", "HP", "ASUS"],
  },
  audio: {
    label: "Audio",
    plural: "Audio & Headphones",
    icon: Headphones,
    mood: "bg-emerald-50 text-emerald-900 border-emerald-200",
    description: "Genuine refurbished accessories including headphones, chargers, cases and cables. Tested and quality-checked.",
    filters: ["Sony", "Apple", "Bose"],
    brands: ["Sony", "Apple", "Bose", "Samsung"],
  },
};

// ─── Mock product data per category ─────────────────────────────────────────

const PRODUCTS: Record<string, {
  id: string; title: string; brand: string; grade: string;
  storage: string; price: number; originalPrice: number; rating: number; reviews: number;
  image: string;
}[]> = {
  phones: [
    { id: "ip15pm", title: "iPhone 15 Pro Max", brand: "Apple", grade: "Excellent", storage: "256 GB", price: 879, originalPrice: 1199, rating: 4.9, reviews: 312, image: "/showcase_iphone.png" },
    { id: "ip15pro", title: "iPhone 15 Pro", brand: "Apple", grade: "Pristine", storage: "256 GB", price: 729, originalPrice: 999, rating: 4.8, reviews: 492, image: "/showcase_iphone.png" },
    { id: "ip14pm", title: "iPhone 14 Pro Max", brand: "Apple", grade: "Excellent", storage: "256 GB", price: 689, originalPrice: 1199, rating: 4.8, reviews: 782, image: "/showcase_iphone.png" },
    { id: "ip14p", title: "iPhone 14 Pro", brand: "Apple", grade: "Excellent", storage: "256 GB", price: 579, originalPrice: 999, rating: 4.8, reviews: 1847, image: "/showcase_iphone.png" },
    { id: "ip13", title: "iPhone 13", brand: "Apple", grade: "Very Good", storage: "128 GB", price: 299, originalPrice: 599, rating: 4.7, reviews: 924, image: "/showcase_iphone.png" },
    { id: "ip15", title: "iPhone 15", brand: "Apple", grade: "Pristine", storage: "128 GB", price: 549, originalPrice: 799, rating: 4.7, reviews: 204, image: "/showcase_iphone.png" },
    { id: "ip12", title: "iPhone 12", brand: "Apple", grade: "Good", storage: "128 GB", price: 239, originalPrice: 599, rating: 4.5, reviews: 1102, image: "/showcase_iphone.png" },
    { id: "sgs24u", title: "Galaxy S24 Ultra", brand: "Samsung", grade: "Excellent", storage: "512 GB", price: 829, originalPrice: 1299, rating: 4.8, reviews: 541, image: "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?w=400&auto=format&fit=crop&q=80" },
    { id: "sgs24", title: "Galaxy S24", brand: "Samsung", grade: "Pristine", storage: "256 GB", price: 519, originalPrice: 799, rating: 4.7, reviews: 183, image: "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?w=400&auto=format&fit=crop&q=80" },
    { id: "sgs23u", title: "Galaxy S23 Ultra", brand: "Samsung", grade: "Excellent", storage: "256 GB", price: 629, originalPrice: 1199, rating: 4.8, reviews: 934, image: "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?w=400&auto=format&fit=crop&q=80" },
    { id: "sgs23", title: "Galaxy S23", brand: "Samsung", grade: "Very Good", storage: "128 GB", price: 349, originalPrice: 799, rating: 4.6, reviews: 428, image: "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?w=400&auto=format&fit=crop&q=80" },
    { id: "pixel8p", title: "Pixel 8 Pro", brand: "Google", grade: "Excellent", storage: "256 GB", price: 549, originalPrice: 999, rating: 4.7, reviews: 218, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=80" },
    { id: "pixel7p", title: "Pixel 7 Pro", brand: "Google", grade: "Very Good", storage: "128 GB", price: 329, originalPrice: 899, rating: 4.6, reviews: 412, image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=80" },
    { id: "op11", title: "OnePlus 11", brand: "OnePlus", grade: "Excellent", storage: "256 GB", price: 389, originalPrice: 699, rating: 4.7, reviews: 104, image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=400&auto=format&fit=crop&q=80" },
  ],
  tablets: [
    { id: "ipadpro13", title: "iPad Pro 13\" M4", brand: "Apple", grade: "Excellent", storage: "256 GB", price: 899, originalPrice: 1299, rating: 4.9, reviews: 184, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80" },
    { id: "ipadpro11", title: "iPad Pro 11\" M2", brand: "Apple", grade: "Pristine", storage: "256 GB", price: 629, originalPrice: 899, rating: 4.8, reviews: 289, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80" },
    { id: "ipada5", title: "iPad Air 5th Gen", brand: "Apple", grade: "Excellent", storage: "64 GB", price: 389, originalPrice: 599, rating: 4.8, reviews: 422, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80" },
    { id: "ipadair4", title: "iPad Air 4th Gen", brand: "Apple", grade: "Very Good", storage: "64 GB", price: 299, originalPrice: 599, rating: 4.6, reviews: 504, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80" },
    { id: "ipad10", title: "iPad 10th Gen", brand: "Apple", grade: "Very Good", storage: "64 GB", price: 299, originalPrice: 449, rating: 4.6, reviews: 311, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80" },
    { id: "ipadmini6", title: "iPad Mini 6th Gen", brand: "Apple", grade: "Excellent", storage: "64 GB", price: 349, originalPrice: 499, rating: 4.7, reviews: 198, image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=80" },
    { id: "tabs10p", title: "Galaxy Tab S10+", brand: "Samsung", grade: "Excellent", storage: "256 GB", price: 649, originalPrice: 999, rating: 4.7, reviews: 129, image: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=400&auto=format&fit=crop&q=80" },
    { id: "tabs9u", title: "Galaxy Tab S9 Ultra", brand: "Samsung", grade: "Pristine", storage: "256 GB", price: 589, originalPrice: 1099, rating: 4.8, reviews: 83, image: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=400&auto=format&fit=crop&q=80" },
    { id: "tabs9fe", title: "Galaxy Tab S9 FE", brand: "Samsung", grade: "Very Good", storage: "128 GB", price: 289, originalPrice: 449, rating: 4.5, reviews: 104, image: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=400&auto=format&fit=crop&q=80" },
    { id: "surfpro9", title: "Surface Pro 9", brand: "Microsoft", grade: "Very Good", storage: "256 GB", price: 699, originalPrice: 999, rating: 4.5, reviews: 87, image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80" },
    { id: "surfpro8", title: "Surface Pro 8", brand: "Microsoft", grade: "Good", storage: "256 GB", price: 449, originalPrice: 899, rating: 4.4, reviews: 139, image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=400&auto=format&fit=crop&q=80" },
  ],
  consoles: [
    { id: "ps5disc", title: "PS5 Disc Edition", brand: "Sony", grade: "Excellent", storage: "825 GB", price: 399, originalPrice: 499, rating: 4.9, reviews: 2104, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&auto=format&fit=crop&q=80" },
    { id: "ps5slim", title: "PS5 Slim Digital", brand: "Sony", grade: "Excellent", storage: "1 TB", price: 319, originalPrice: 389, rating: 4.8, reviews: 492, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&auto=format&fit=crop&q=80" },
    { id: "ps5dig", title: "PS5 Digital Edition", brand: "Sony", grade: "Excellent", storage: "825 GB", price: 329, originalPrice: 399, rating: 4.8, reviews: 1622, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&auto=format&fit=crop&q=80" },
    { id: "ps4pro", title: "PS4 Pro", brand: "Sony", grade: "Very Good", storage: "1 TB", price: 189, originalPrice: 399, rating: 4.6, reviews: 873, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&auto=format&fit=crop&q=80" },
    { id: "ps4slim", title: "PS4 Slim", brand: "Sony", grade: "Very Good", storage: "500 GB", price: 119, originalPrice: 299, rating: 4.5, reviews: 624, image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400&auto=format&fit=crop&q=80" },
    { id: "xbxsx", title: "Xbox Series X", brand: "Microsoft", grade: "Excellent", storage: "1 TB", price: 369, originalPrice: 499, rating: 4.8, reviews: 1241, image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&auto=format&fit=crop&q=80" },
    { id: "xbss", title: "Xbox Series S", brand: "Microsoft", grade: "Excellent", storage: "512 GB", price: 219, originalPrice: 299, rating: 4.7, reviews: 982, image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&auto=format&fit=crop&q=80" },
    { id: "xbone", title: "Xbox One S", brand: "Microsoft", grade: "Good", storage: "500 GB", price: 99, originalPrice: 249, rating: 4.4, reviews: 402, image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&auto=format&fit=crop&q=80" },
    { id: "xbonex", title: "Xbox One X", brand: "Microsoft", grade: "Very Good", storage: "1 TB", price: 139, originalPrice: 399, rating: 4.6, reviews: 294, image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=400&auto=format&fit=crop&q=80" },
    { id: "nswoled", title: "Switch OLED", brand: "Nintendo", grade: "Excellent", storage: "64 GB", price: 239, originalPrice: 349, rating: 4.8, reviews: 1580, image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80" },
    { id: "nslite", title: "Switch Lite", brand: "Nintendo", grade: "Excellent", storage: "32 GB", price: 129, originalPrice: 199, rating: 4.6, reviews: 312, image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80" },
    { id: "nsorig", title: "Switch V2", brand: "Nintendo", grade: "Very Good", storage: "32 GB", price: 169, originalPrice: 279, rating: 4.7, reviews: 894, image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&auto=format&fit=crop&q=80" },
  ],
  laptops: [
    { id: "mbpm3max16", title: "MacBook Pro 16\" M3 Max", brand: "Apple", grade: "Excellent", storage: "512 GB SSD", price: 2199, originalPrice: 3499, rating: 4.9, reviews: 241, image: "/showcase_macbook.png" },
    { id: "mbpm2pro", title: "MacBook Pro 14\" M2 Pro", brand: "Apple", grade: "Pristine", storage: "512 GB SSD", price: 1249, originalPrice: 1999, rating: 4.8, reviews: 104, image: "/showcase_macbook.png" },
    { id: "mbam2", title: "MacBook Air 13\" M2", brand: "Apple", grade: "Excellent", storage: "256 GB SSD", price: 799, originalPrice: 1099, rating: 4.9, reviews: 1124, image: "/showcase_macbook.png" },
    { id: "mbpm1", title: "MacBook Pro 13\" M1", brand: "Apple", grade: "Excellent", storage: "256 GB SSD", price: 549, originalPrice: 1299, rating: 4.7, reviews: 832, image: "/showcase_macbook.png" },
    { id: "mbam1", title: "MacBook Air 13\" M1", brand: "Apple", grade: "Very Good", storage: "256 GB SSD", price: 479, originalPrice: 999, rating: 4.7, reviews: 1541, image: "/showcase_macbook.png" },
    { id: "xps15", title: "Dell XPS 15", brand: "Dell", grade: "Very Good", storage: "512 GB SSD", price: 899, originalPrice: 1499, rating: 4.7, reviews: 318, image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=80" },
    { id: "xps13", title: "Dell XPS 13", brand: "Dell", grade: "Pristine", storage: "512 GB SSD", price: 689, originalPrice: 1199, rating: 4.8, reviews: 92, image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=80" },
    { id: "x1c12", title: "ThinkPad X1 Carbon G12", brand: "Lenovo", grade: "Excellent", storage: "512 GB SSD", price: 849, originalPrice: 1699, rating: 4.7, reviews: 194, image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&auto=format&fit=crop&q=80" },
    { id: "tpadt14", title: "ThinkPad T14 Gen 3", brand: "Lenovo", grade: "Very Good", storage: "512 GB SSD", price: 499, originalPrice: 999, rating: 4.6, reviews: 204, image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=400&auto=format&fit=crop&q=80" },
    { id: "spectre", title: "HP Spectre x360 14", brand: "HP", grade: "Very Good", storage: "512 GB SSD", price: 749, originalPrice: 1299, rating: 4.6, reviews: 112, image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=80" },
    { id: "hpenvy", title: "HP Envy x360", brand: "HP", grade: "Good", storage: "512 GB SSD", price: 449, originalPrice: 899, rating: 4.4, reviews: 83, image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400&auto=format&fit=crop&q=80" },
  ],
  audio: [
    { id: "wh1000", title: "Sony WH-1000XM5", brand: "Sony", grade: "Pristine", storage: "—", price: 219, originalPrice: 399, rating: 4.9, reviews: 2841, image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&auto=format&fit=crop&q=80" },
    { id: "wh1000xm4", title: "Sony WH-1000XM4", brand: "Sony", grade: "Excellent", storage: "—", price: 159, originalPrice: 299, rating: 4.8, reviews: 1982, image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&auto=format&fit=crop&q=80" },
    { id: "wf1000xm5", title: "Sony WF-1000XM5", brand: "Sony", grade: "Excellent", storage: "—", price: 139, originalPrice: 219, rating: 4.7, reviews: 124, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80" },
    { id: "airpodspro2", title: "AirPods Pro 2nd Gen", brand: "Apple", grade: "Excellent", storage: "—", price: 159, originalPrice: 249, rating: 4.8, reviews: 1490, image: "/showcase_airpods_pro.png" },
    { id: "airpods3", title: "AirPods 3rd Gen", brand: "Apple", grade: "Pristine", storage: "—", price: 99, originalPrice: 169, rating: 4.7, reviews: 582, image: "/showcase_airpods_pro.png" },
    { id: "airpodsmax", title: "AirPods Max", brand: "Apple", grade: "Excellent", storage: "—", price: 349, originalPrice: 549, rating: 4.8, reviews: 814, image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&auto=format&fit=crop&q=80" },
    { id: "boseqc45", title: "Bose QuietComfort 45", brand: "Bose", grade: "Very Good", storage: "—", price: 149, originalPrice: 329, rating: 4.7, reviews: 621, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&auto=format&fit=crop&q=80" },
    { id: "boseultra", title: "Bose QuietComfort Ultra", brand: "Bose", grade: "Pristine", storage: "—", price: 239, originalPrice: 429, rating: 4.9, reviews: 304, image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&auto=format&fit=crop&q=80" },
    { id: "beatsstudio", title: "Beats Studio Pro", brand: "Apple", grade: "Excellent", storage: "—", price: 179, originalPrice: 349, rating: 4.6, reviews: 193, image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&auto=format&fit=crop&q=80" },
    { id: "galaxybuds2", title: "Galaxy Buds2 Pro", brand: "Samsung", grade: "Excellent", storage: "—", price: 89, originalPrice: 229, rating: 4.6, reviews: 384, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&auto=format&fit=crop&q=80" },
  ],
};

const GRADES = ["Pristine", "Excellent", "Very Good", "Good"];

const SORT_OPTIONS = [
  { id: "featured",   label: "Featured" },
  { id: "price-asc",  label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "rating",     label: "Top Rated" },
];

const SUB_BRANDS: Record<string, { label: string; image: string; brand: string; bg: string }[]> = {
  phones: [
    { label: "iPhone", brand: "Apple", bg: "bg-blue-50 text-blue-900 border-blue-100 hover:bg-blue-100/50", image: "/showcase_iphone.png" },
    { label: "Galaxy", brand: "Samsung", bg: "bg-purple-50 text-purple-900 border-purple-100 hover:bg-purple-100/50", image: "https://images.unsplash.com/photo-1610792516307-ea5acd9c3b00?w=300&auto=format&fit=crop&q=80" },
    { label: "Pixel", brand: "Google", bg: "bg-amber-50 text-amber-900 border-amber-100 hover:bg-amber-100/50", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=300&auto=format&fit=crop&q=80" },
    { label: "OnePlus", brand: "OnePlus", bg: "bg-rose-50 text-rose-900 border-rose-100 hover:bg-rose-100/50", image: "https://images.unsplash.com/photo-1616348436168-de43ad0db179?w=300&auto=format&fit=crop&q=80" },
  ],
  tablets: [
    { label: "iPads", brand: "Apple", bg: "bg-blue-50 text-blue-900 border-blue-100 hover:bg-blue-100/50", image: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&auto=format&fit=crop&q=80" },
    { label: "Galaxy Tabs", brand: "Samsung", bg: "bg-purple-50 text-purple-900 border-purple-100 hover:bg-purple-100/50", image: "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?w=300&auto=format&fit=crop&q=80" },
    { label: "Surface Pro", brand: "Microsoft", bg: "bg-slate-50 text-slate-900 border-slate-100 hover:bg-slate-100/50", image: "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?w=300&auto=format&fit=crop&q=80" },
  ],
  consoles: [
    { label: "PlayStation", brand: "Sony", bg: "bg-blue-50 text-blue-900 border-blue-100 hover:bg-blue-100/50", image: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=300&auto=format&fit=crop&q=80" },
    { label: "Xbox", brand: "Microsoft", bg: "bg-green-50 text-green-900 border-green-100 hover:bg-green-100/50", image: "https://images.unsplash.com/photo-1605901309584-818e25960a8f?w=300&auto=format&fit=crop&q=80" },
    { label: "Nintendo", brand: "Nintendo", bg: "bg-red-50 text-red-900 border-red-100 hover:bg-red-100/50", image: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=300&auto=format&fit=crop&q=80" },
  ],
  laptops: [
    { label: "MacBooks", brand: "Apple", bg: "bg-blue-50 text-blue-900 border-blue-100 hover:bg-blue-100/50", image: "/showcase_macbook.png" },
    { label: "Dell XPS", brand: "Dell", bg: "bg-slate-50 text-slate-900 border-slate-100 hover:bg-slate-100/50", image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&auto=format&fit=crop&q=80" },
    { label: "ThinkPads", brand: "Lenovo", bg: "bg-red-50 text-red-900 border-red-100 hover:bg-red-100/50", image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=300&auto=format&fit=crop&q=80" },
  ],
  audio: [
    { label: "Sony WH", brand: "Sony", bg: "bg-zinc-50 text-zinc-900 border-zinc-200 hover:bg-zinc-100/50", image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=300&auto=format&fit=crop&q=80" },
    { label: "AirPods", brand: "Apple", bg: "bg-blue-50 text-blue-900 border-blue-100 hover:bg-blue-100/50", image: "/showcase_airpods_pro.png" },
    { label: "Bose QC", brand: "Bose", bg: "bg-emerald-50 text-emerald-900 border-emerald-100 hover:bg-emerald-100/50", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=300&auto=format&fit=crop&q=80" },
  ],
};

const BRAND_LOGOS: Record<string, React.ReactNode> = {
  Apple: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 170 170">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.36-6.17-2.9-2.42-6.66-6.87-11.28-13.38-5.31-7.5-9.87-15.93-13.68-25.3-3.82-9.37-5.73-18.41-5.73-27.13 0-14.68 4.13-26.69 12.39-36.03 8.26-9.34 18.26-14.07 30-14.18 5.7.1 11.23 1.57 16.58 4.41 5.35 2.84 9.17 4.26 11.48 4.26 2.12 0 6.06-1.48 11.83-4.44 5.76-2.96 11.29-4.38 16.59-4.26 12.18.23 22.06 4.79 29.62 13.68 5.48 6.4 9.27 13.68 11.39 21.84-12.83 5.25-21.43 12.98-25.8 23.2-4.38 10.22-4.14 20.9 0 32.06 3.1 8.35 8.1 15.35 15.02 21.02zm-28.53-118.73c0 7.9-2.88 15.15-8.63 21.75-5.76 6.6-12.79 10.5-21.1 11.72.13-7.5 3.12-14.8 8.98-21.87 5.86-7.07 13-11.13 21.42-12.18.63 8.33-.67 15.2-1.67 20.58z"/>
    </svg>
  ),
  Samsung: (
    <span className="font-extrabold text-[9px] tracking-widest uppercase">Samsung</span>
  ),
  Google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
    </svg>
  ),
  OnePlus: (
    <span className="font-extrabold text-[10px] tracking-tight border-2 border-black px-1.5 py-0.5 rounded-sm uppercase">1+</span>
  ),
  Sony: (
    <span className="font-black text-[10px] tracking-widest uppercase italic">Sony</span>
  ),
  Nintendo: (
    <span className="font-extrabold text-[8px] bg-red-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Nintendo</span>
  ),
  Microsoft: (
    <svg className="w-4 h-4" viewBox="0 0 23 23">
      <rect width="10.8" height="10.8" fill="#F25022"/>
      <rect x="12.2" width="10.8" height="10.8" fill="#7FBA00"/>
      <rect y="12.2" width="10.8" height="10.8" fill="#00A4EF"/>
      <rect x="12.2" y="12.2" width="10.8" height="10.8" fill="#FFB900"/>
    </svg>
  ),
  Dell: (
    <span className="font-extrabold text-[9px] border border-black rounded-full px-1.5 py-0.5">DELL</span>
  ),
  Lenovo: (
    <span className="font-bold text-[9px] bg-red-600 text-white px-1.5 py-0.5 uppercase tracking-tighter">Lenovo</span>
  ),
  Bose: (
    <span className="font-bold text-[8px] tracking-widest uppercase italic">Bose</span>
  ),
};

const ACCESSORIES: Record<string, string[]> = {
  phones: ["Smartphone Cases", "Fast Chargers", "Screen Protectors", "Car Mounts", "USB-C Cables"],
  tablets: ["iPad Cases", "Apple Pencils", "Styluses", "Tablet Stands", "Screen Protectors"],
  consoles: ["PS5 Controllers", "Xbox Wireless Controllers", "Console Headsets", "HDMI 2.1 Cables"],
  laptops: ["Laptop Sleeves", "USB-C Hubs", "Laptop Chargers", "Keyboard Covers"],
  audio: ["Headphone Cases", "Ear Tips", "Charging Docks", "Aux Cables"],
};

const DIAGNOSTIC_STEPS: { id: string; label: string; icon: React.ComponentType<{ className?: string }>; description: string; checks: string[] }[] = [
  { id: "battery", label: "Battery Health", icon: Battery, description: "Every device is certified to have at least 85% battery capacity compared to new, often higher.", checks: ["Capacity verification", "Amperage testing", "Charge cycles count", "Overheating check"] },
  { id: "camera", label: "Camera & Lens", icon: Camera, description: "Lenses are inspected for scratches, autofocus calibration is tested, and flash output is verified.", checks: ["Autofocus speed calibration", "Flash synchronization", "Front/rear sensor check", "Lens scratch audit"] },
  { id: "screen", label: "Screen & Touch", icon: Monitor, description: "Digitizer response is scanned across the whole screen. Pixels are inspected for discoloration or dead spots.", checks: ["Multi-touch responsiveness", "Dead pixel scan", "Backlight consistency", "Scratch/crack assessment"] },
  { id: "wireless", label: "Connectivity", icon: Wifi, description: "WiFi modules, Bluetooth chips, and cellular bands are connected to diagnostic relays to verify signal strengths.", checks: ["WiFi 6 bandwidth test", "Bluetooth pair stability", "Cellular band activation", "NFC chip test"] },
  { id: "buttons", label: "Buttons & Ports", icon: Cpu, description: "Haptic engines, mechanical buttons, USB-C/Lightning ports, and headphone jacks are physically cycle-tested.", checks: ["Haptic feedback check", "USB port current stability", "Button tactile response", "Speaker grill cleaning"] },
];

const MOCK_REVIEWS = [
  {
    id: 1,
    name: "Brandiss M.",
    rating: 5,
    date: "Yesterday",
    text: "So glad this phone worked out for me. It's exactly as described and works without issues. This is the 3rd phone I ordered.",
    model: "iPhone 13 Pro Max 256GB - Gold - Unlocked",
    verified: true,
    image: "https://picsum.photos/seed/custphone1/400/500",
    thumbnail: "https://picsum.photos/seed/iphone_wanted/100/100"
  },
  {
    id: 2,
    name: "Fox T.",
    rating: 5,
    date: "3 days ago",
    text: "Phone came absolutely pristine! Honestly could have fooled me for it being brand new. I did miss the delivery and it required signature.",
    model: "Google Pixel 7 128GB - Green - Unlocked",
    verified: true,
    image: "https://picsum.photos/seed/custphone2/400/500",
    thumbnail: "https://picsum.photos/seed/google_wanted/100/100"
  },
  {
    id: 3,
    name: "John T.",
    rating: 5,
    date: "Last week",
    text: "Phone was delivered quickly, matched the condition described, AND has a brand new battery! I would definitely order from this company again.",
    model: "iPhone 12 mini 128GB - White - Unlocked",
    verified: true,
    image: "https://picsum.photos/seed/custphone3/400/500",
    thumbnail: "https://picsum.photos/seed/iphone_wanted/100/100"
  },
  {
    id: 4,
    name: "Brandon R.",
    rating: 5,
    date: "2 weeks ago",
    text: "I ordered the excellent condition and when the phone arrived I was amazed, the phone had no scratches or anything and the battery is at 98%.",
    model: "iPhone 12 128GB - Blue - Unlocked",
    verified: true,
    image: "https://picsum.photos/seed/custphone4/400/500",
    thumbnail: "https://picsum.photos/seed/iphone_wanted/100/100"
  },
];

const BUYING_GUIDES: Record<string, { title: string; readTime: string; image: string; desc: string }[]> = {
  phones: [
    { title: "Refurbished iPhone vs. Android Guide", readTime: "5 min read", image: "https://picsum.photos/seed/blog1/400/250", desc: "Which operating system should you choose for your next refurbished smartphone?" },
    { title: "How we test battery health", readTime: "3 min read", image: "https://picsum.photos/seed/blog2/400/250", desc: "An inside look at our 90-point battery diagnostics and capacity threshold check." },
    { title: "Is the iPhone 15 still worth it?", readTime: "4 min read", image: "https://picsum.photos/seed/blog3/400/250", desc: "Comparing price drop statistics and specs between the latest refurbished generations." },
  ],
  tablets: [
    { title: "Refurbished iPad Buyer's Guide", readTime: "6 min read", image: "https://picsum.photos/seed/blog4/400/250", desc: "From iPad Mini to Pro, find the perfect refurbished model for your workflow." },
    { title: "Why buy a refurbished tablet?", readTime: "3 min read", image: "https://picsum.photos/seed/blog5/400/250", desc: "Discover how buying refurbished helps the environment and your wallet." },
  ],
  consoles: [
    { title: "PS5 vs Xbox Series X in 2026", readTime: "7 min read", image: "https://picsum.photos/seed/blog6/400/250", desc: "Which console should you pick for next-gen refurbished gaming?" },
    { title: "Refurbished console checklist", readTime: "4 min read", image: "https://picsum.photos/seed/blog7/400/250", desc: "What our engineers inspect inside every console before shipping it." },
  ],
  laptops: [
    { title: "MacBook Air vs Pro refurbished", readTime: "5 min read", image: "https://picsum.photos/seed/blog8/400/250", desc: "Find the balance between portable battery life and heavy performance." },
    { title: "Refurbished Lenovo ThinkPad Guide", readTime: "4 min read", image: "https://picsum.photos/seed/blog9/400/250", desc: "Why businesses choose refurbished corporate laptops for long-term durability." },
  ],
  audio: [
    { title: "Active Noise Cancellation compared", readTime: "4 min read", image: "https://picsum.photos/seed/blog10/400/250", desc: "Comparing ANC performance of refurbished Sony, Apple, and Bose headphones." },
    { title: "How to clean wireless earbuds safely", readTime: "3 min read", image: "https://picsum.photos/seed/blog11/400/250", desc: "Pro tips to sanitize and restore audio quality on pre-owned earbuds." },
  ],
};

const SEO_TEXT: Record<string, { title: string; content: string[] }> = {
  phones: {
    title: "Everything you need to know about buying a refurbished smartphone",
    content: [
      "Buying a refurbished phone doesn't mean compromising on quality. Every smartphone on TechStop goes through a rigorous inspection process where our expert technicians run over 90 diagnostic tests. We check everything from screen responsiveness, camera focus, speaker output, and wireless connectivity to the mechanical buttons and the battery life.",
      "By purchasing a certified refurbished smartphone, you are saving up to 70% compared to buying a brand-new retail device. Plus, you get the security of our free 2-year warranty and a 30-day money-back return policy. It is better for your wallet and significantly reduces carbon footprint and electronic waste."
    ]
  },
  tablets: {
    title: "Why buying a refurbished tablet is the smart choice",
    content: [
      "Whether you are looking for a refurbished iPad for drawing, a Samsung Galaxy Tab for streaming, or a Microsoft Surface for remote office work, TechStop offers fully tested, premium tablets at a fraction of their retail price.",
      "All tablet batteries are guaranteed to meet our high-capacity standard (minimum 85%), screens are checked for backlight consistency, and digitizers are audited for absolute stylus accuracy. Save money, save the environment, and shop with confidence."
    ]
  },
  consoles: {
    title: "Refurbished gaming consoles: Next-gen performance for less",
    content: [
      "TechStop's gaming collection features fully vetted, cleaned, and updated consoles including PlayStation 5, Xbox Series X/S, and Nintendo Switch. Every console undergoes deep thermal testing to prevent fan noise issues, and optical drives are verified for disc loading and playback.",
      "Get next-gen gaming power at incredible prices. Our refurbishing process ensures the motherboard is free of dust build-up, and all ports are tested for maximum input stability. Plus, every console comes with verified original or certified controller bundles."
    ]
  },
  laptops: {
    title: "Premium refurbished laptops and MacBooks built to last",
    content: [
      "Explore high-performance business laptops, light ultrabooks, and robust creative machines. Every MacBook and Windows notebook on TechStop is battery-audited, keyboard-tested, and clean-installed with the latest operating systems.",
      "Get up to 75% off compared to buying brand new. Whether it is an Apple M3 MacBook Pro, a corporate-grade Lenovo ThinkPad, or a sleek Dell XPS, our laptops are checked for screen defects, SSD read speeds, and memory stability, backed by our 2-year warranty."
    ]
  },
  audio: {
    title: "High-fidelity refurbished headphones and earbuds",
    content: [
      "Listen to your favorite albums in high definition with premium noise-canceling headphones and wireless earbuds. Our audio gear goes through ultrasonic cleaning and sanitation, battery cycle evaluation, and driver frequency response testing.",
      "From Apple AirPods Pro to Sony's industry-leading WH-1000XM5, TechStop offers pristine and excellent audio products. Every device is tested for Bluetooth stability, active noise cancellation depth, and microphone clarity."
    ]
  }
};

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = (params?.category as string)?.toLowerCase();
  const meta = CATEGORY_META[categorySlug];

  const [activeBrands, setActiveBrands] = useState<string[]>([]);
  const [activeGrades, setActiveGrades] = useState<string[]>([]);
  const [sort, setSort] = useState("featured");
  const [showSort, setShowSort] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTabBrand, setActiveTabBrand] = useState<string>("all");
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<string>("battery");

  if (!meta) {
    notFound();
    return null;
  }

  function handleAdd(id: string) {
    setAddedIds(prev => new Set(prev).add(id));
    setTimeout(() => setAddedIds(prev => { const s = new Set(prev); s.delete(id); return s; }), 2000);
  }

  function toggleFilter(item: string, list: string[], setList: (v: string[]) => void) {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  }

  const CategoryIcon = meta.icon;
  const allProducts = PRODUCTS[categorySlug] ?? [];

  let filtered = allProducts.filter(p => {
    const matchBrand = activeBrands.length === 0 || activeBrands.includes(p.brand);
    const matchGrade = activeGrades.length === 0 || activeGrades.includes(p.grade);
    return matchBrand && matchGrade;
  });

  if (sort === "price-asc") filtered = [...filtered].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered = [...filtered].sort((a, b) => b.price - a.price);
  if (sort === "rating") filtered = [...filtered].sort((a, b) => b.rating - a.rating);

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-black font-sans selection:bg-accent selection:text-black">
      <Navbar />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
          <div className="mb-4 flex items-center gap-2 text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wide">
            <Link href="/shop" className="hover:text-black flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Shop
            </Link>
            <span>/</span>
            <span className="text-black">{meta.plural}</span>
          </div>

          <div className="py-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-2">{meta.plural}</h1>
            <p className="text-zinc-500 font-medium max-w-2xl text-sm md:text-base leading-relaxed">{meta.description}</p>
          </div>
        </div>
      </section>

      {/* ── Most Wanted Sub-brands & Accessories ────────────────────────── */}
      <section className="bg-white border-b border-zinc-100 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Sub-brand Grid */}
          {SUB_BRANDS[categorySlug] && (
            <div className="mb-8">
              <h2 className="text-lg font-extrabold mb-4 tracking-tight">Shop our most wanted</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SUB_BRANDS[categorySlug].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setActiveBrands([item.brand]);
                      setActiveGrades([]);
                      const element = document.getElementById("product-grid");
                      if (element) element.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="flex flex-col gap-2.5 group text-left"
                  >
                    <div className="w-full aspect-[16/10] rounded-[24px] bg-[#e2ff70] hover:bg-[#d6f24d] transition-all duration-300 relative overflow-hidden flex items-center justify-center p-3">
                      <img
                        src={item.image}
                        alt={item.label}
                        className="w-4/5 h-4/5 object-contain group-hover:scale-[1.06] transition-transform duration-300 mix-blend-multiply"
                      />
                    </div>
                    <span className="font-extrabold text-sm text-zinc-900 group-hover:text-black pl-1">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Accessories Row */}
          {ACCESSORIES[categorySlug] && (
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest shrink-0">Accessories:</span>
              {ACCESSORIES[categorySlug].map((acc) => (
                <Link
                  key={acc}
                  href="/shop"
                  className="shrink-0 h-9 px-4 rounded-full border border-zinc-200 text-xs font-bold hover:border-black transition-colors flex items-center bg-white text-zinc-700"
                >
                  {acc}
                </Link>
              ))}
            </div>
          )}
          
        </div>
      </section>

      {/* ── Reassurance Bar ─────────────────────────────────────────────────── */}
      <div className="bg-zinc-50 border-b border-zinc-200 py-3">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap justify-between items-center gap-4 text-[11px] font-bold text-zinc-600">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">✓</span> 90-point quality check on all devices
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300 hidden md:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">✓</span> Free 2-Year Warranty included
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300 hidden md:block"></div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600">✓</span> Free Express 1-2 Day Delivery
          </div>
        </div>
      </div>

      {/* ── Body ─────────────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12">
        <div className="flex flex-col">

          {/* ── Top Picks Carousel ────────────────────────────────────────────────── */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Top Picks for You</h2>
              <div className="flex gap-2 hidden md:flex">
                <button className="h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"><ArrowLeft className="h-5 w-5" /></button>
                <button className="h-10 w-10 rounded-full bg-white border border-zinc-200 flex items-center justify-center hover:bg-zinc-50"><ArrowRight className="h-5 w-5" /></button>
              </div>
            </div>
            <div className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              {allProducts.slice(0, 8).map(product => (
                <Link href={`/shop/${categorySlug}/${product.id}`} key={`top-${product.id}`} className="shrink-0 w-[240px] md:w-[280px] group block">
                  <div className="bg-white rounded-[32px] p-3 border border-zinc-200 hover:border-black hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="relative aspect-square rounded-[24px] bg-[#f5f5f7] mb-5 p-6 flex items-center justify-center">
                      <span className="absolute top-4 left-4 inline-flex px-2.5 py-1 rounded-full bg-accent text-[10px] font-bold text-black border border-accent shadow-sm uppercase tracking-wider">
                        Best Seller
                      </span>
                      <img src={product.image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="px-2 flex flex-col flex-1 pb-2">
                      <h3 className="font-bold text-lg leading-tight mb-1">{product.title}</h3>
                      <div className="flex items-baseline gap-2 mt-auto pt-4">
                        <span className="text-xl md:text-2xl font-bold tracking-tight">£{product.price}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── Top Brands Refurbished (Screenshot 2 Alignment) ────────────────── */}
          <div className="mb-12">
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 mb-5">Top brands, refurbished</h2>
            
            <div className="bg-[#f0f2f5]/40 border border-zinc-200 rounded-[32px] p-5 md:p-7 flex flex-col lg:flex-row gap-6 md:gap-8">
              
              {/* Left Column: Lifestyle Flatlay Banner */}
              <div className="w-full lg:w-[260px] h-[340px] md:h-[400px] rounded-[24px] overflow-hidden shrink-0 relative shadow-sm">
                <img
                  src="https://picsum.photos/seed/flatlay_tech/500/700"
                  alt="Tech Stop lifestyle flatlay"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex flex-col justify-end p-5">
                  <span className="text-[10px] font-bold text-accent uppercase tracking-widest mb-1">TechStop Certified</span>
                  <h3 className="text-white font-extrabold text-lg leading-tight">Refurbished & Tested by Experts</h3>
                </div>
              </div>

              {/* Right Column: Logos & Product Carousel */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                
                {/* Brand Tabs Logo Row */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <button
                    onClick={() => setActiveTabBrand("all")}
                    className={`h-11 px-5 rounded-2xl text-xs font-bold transition-all border flex items-center justify-center bg-white ${
                      activeTabBrand === "all" ? "border-black shadow-sm" : "border-zinc-200 text-zinc-500 hover:border-zinc-400"
                    }`}
                  >
                    All Brands
                  </button>
                  {meta.brands.map(b => (
                    <button
                      key={b}
                      onClick={() => setActiveTabBrand(b)}
                      className={`h-11 px-5 rounded-2xl transition-all border flex items-center justify-center bg-white ${
                        activeTabBrand === b ? "border-black shadow-sm" : "border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {BRAND_LOGOS[b] ? (
                        <div className="flex items-center text-zinc-950 font-extrabold">
                          {BRAND_LOGOS[b]}
                        </div>
                      ) : (
                        <span className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-950">{b}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Horizontal Product Carousel */}
                <div className="relative flex-1">
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    {allProducts
                      .filter(p => activeTabBrand === "all" || p.brand === activeTabBrand)
                      .map(product => (
                        <Link href={`/shop/${categorySlug}/${product.id}`} key={`tab-${product.id}`} className="shrink-0 w-[210px] md:w-[230px] group block">
                          <div className="bg-white rounded-[24px] p-3 border border-zinc-200 hover:border-black hover:shadow-lg transition-all duration-300 h-full flex flex-col justify-between">
                            
                            {/* Centered Image */}
                            <div className="relative aspect-[4/3] rounded-[18px] bg-[#f5f5f7] mb-3 p-4 flex items-center justify-center">
                              <img src={product.image} alt={product.title} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform" />
                            </div>

                            {/* Product Info */}
                            <div className="px-1 flex flex-col flex-1">
                              <h3 className="font-bold text-xs leading-tight mb-1 text-zinc-900 group-hover:text-black">
                                {product.title}
                              </h3>
                              <span className="text-[10px] font-semibold text-zinc-400 block mb-1">
                                {product.brand} • {product.storage} • {product.grade}
                              </span>
                              
                              {/* Rating stars */}
                              <div className="flex items-center gap-1.5 mb-3">
                                <div className="flex items-center text-zinc-950">
                                  <Star className="h-3 w-3 fill-black text-black" strokeWidth={3} />
                                </div>
                                <span className="text-[10px] font-bold text-zinc-800">{product.rating}</span>
                                <span className="text-[10px] text-zinc-400 font-semibold">({product.reviews})</span>
                              </div>

                              {/* Price */}
                              <div className="flex items-baseline gap-2 mt-auto pt-1">
                                <span className="text-sm font-extrabold text-zinc-950">£{product.price}</span>
                                <span className="text-[10px] text-zinc-400 line-through font-semibold">£{product.originalPrice} new</span>
                              </div>
                            </div>

                          </div>
                        </Link>
                      ))}
                    {allProducts.filter(p => activeTabBrand === "all" || p.brand === activeTabBrand).length === 0 && (
                      <div className="py-12 w-full text-center text-zinc-400 font-medium">
                        No refurbished {activeTabBrand} products currently featured.
                      </div>
                    )}
                  </div>

                  {/* Carousel navigation arrows mimicking screenshot */}
                  <div className="flex justify-end gap-2 mt-4">
                    <button className="h-8 w-8 rounded-full bg-zinc-200/50 flex items-center justify-center hover:bg-zinc-200 transition-colors"><ArrowLeft className="h-4 w-4 text-zinc-700" /></button>
                    <button className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-black transition-colors"><ArrowRight className="h-4 w-4 text-white" /></button>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* ── Main Grid ───────────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0" id="product-grid">

            {/* Toolbar & Horizontal Filters */}
            <div className="mb-8 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-zinc-600">
                  {filtered.length} products
                </p>
                
                <div className="flex items-center gap-3">
                  {/* Mobile Filter Toggle */}
                  <button
                    onClick={() => setShowFilters(true)}
                    className="lg:hidden flex items-center gap-2 h-11 px-5 rounded-full bg-white border border-zinc-200 text-sm font-bold"
                  >
                    <SlidersHorizontal className="h-4 w-4" /> Filters
                    {(activeGrades.length > 0 || activeBrands.length > 0) && (
                      <span className="h-5 w-5 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center ml-1">
                        {activeGrades.length + activeBrands.length}
                      </span>
                    )}
                  </button>

                  {/* Sort Dropdown */}
                  <div className="relative z-20">
                    <button
                      onClick={() => setShowSort(s => !s)}
                      className="flex items-center gap-2 h-11 px-5 rounded-full bg-white border border-zinc-200 text-sm font-bold hover:border-black transition-colors"
                    >
                      Sort: {SORT_OPTIONS.find(o => o.id === sort)?.label}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {showSort && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute right-0 top-full mt-2 w-56 bg-white border border-zinc-200 rounded-[24px] shadow-xl overflow-hidden"
                        >
                          {SORT_OPTIONS.map(opt => (
                            <button
                             key={opt.id}
                             onClick={() => { setSort(opt.id); setShowSort(false); }}
                             className={`w-full text-left px-5 py-4 text-sm font-bold hover:bg-zinc-50 transition-colors ${sort === opt.id ? "text-black bg-zinc-50" : "text-zinc-600"}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Desktop Horizontal Filters */}
              <div className="hidden lg:flex flex-wrap items-center gap-6 bg-white p-3 px-5 rounded-full border border-zinc-200">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-zinc-400 uppercase tracking-widest">Brand</span>
                  <div className="flex gap-2">
                    {meta.brands.map(brand => {
                      const isActive = activeBrands.includes(brand);
                      return (
                        <button
                          key={brand}
                          onClick={() => toggleFilter(brand, activeBrands, setActiveBrands)}
                          className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                            isActive ? "bg-black text-white border-black" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                <div className="w-px h-6 bg-zinc-200"></div>
                
                <div className="flex items-center gap-3">
                  <span className="font-bold text-xs text-zinc-400 uppercase tracking-widest">Condition</span>
                  <div className="flex gap-2">
                    {GRADES.map(g => {
                      const isActive = activeGrades.includes(g);
                      return (
                        <button
                          key={g}
                          onClick={() => toggleFilter(g, activeGrades, setActiveGrades)}
                          className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                            isActive ? "bg-black text-white border-black" : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400"
                          }`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>



            {/* Active Filters Display (Mobile Only) */}
            {(activeGrades.length > 0 || activeBrands.length > 0) && (
              <div className="flex lg:hidden flex-wrap gap-2 mb-6">
                {[...activeBrands, ...activeGrades].map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      if (activeBrands.includes(f)) setActiveBrands(prev => prev.filter(x => x !== f));
                      if (activeGrades.includes(f)) setActiveGrades(prev => prev.filter(x => x !== f));
                    }}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-zinc-200 text-xs font-bold hover:border-zinc-400"
                  >
                    {f} <X className="h-3 w-3" />
                  </button>
                ))}
                <button
                  onClick={() => { setActiveBrands([]); setActiveGrades([]); }}
                  className="h-8 px-3 text-xs font-bold text-zinc-500 hover:text-black underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Product Grid */}
            {filtered.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-[32px] border border-zinc-200">
                <p className="font-bold text-xl mb-3">No products match your filters</p>
                <button
                  onClick={() => { setActiveBrands([]); setActiveGrades([]); }}
                  className="h-12 px-8 rounded-full bg-black text-white font-bold mt-4"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filtered.map((product, index) => {
                  const added = addedIds.has(product.id);
                  const isPromoSpot = index === 2; // Inject promo after 3rd item
                  
                  return (
                    <React.Fragment key={product.id}>
                      {isPromoSpot && (
                        <div className="bg-[#121212] text-white rounded-[32px] p-8 flex flex-col justify-center items-start group relative overflow-hidden col-span-1 sm:col-span-2 lg:col-span-1">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                           <h3 className="font-bold text-2xl mb-3 relative z-10">Got an old device?</h3>
                           <p className="text-zinc-400 font-medium mb-8 relative z-10">Trade it in and get extra cash towards your new refurbished tech.</p>
                           <Link href="/sell" className="h-12 px-6 rounded-full bg-accent text-black font-bold flex items-center gap-2 hover:scale-105 transition-transform relative z-10">
                             Get an offer <ArrowRight className="h-4 w-4" />
                           </Link>
                        </div>
                      )}
                      <Link href={`/shop/${categorySlug}/${product.id}`} className="group block">
                      <div className="bg-white rounded-[32px] p-3 border border-zinc-200 hover:border-black hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                        
                        <div className="relative aspect-square rounded-[24px] bg-[#f5f5f7] mb-5 overflow-hidden flex items-center justify-center p-6">
                          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
                            <span className="inline-flex px-2.5 py-1 rounded-full bg-white text-[10px] font-bold text-black border border-zinc-200 shadow-sm uppercase tracking-wider">
                              {product.grade}
                            </span>
                          </div>
                          
                          <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                          />

                          <button
                            onClick={e => { e.preventDefault(); handleAdd(product.id); }}
                            className={`absolute bottom-4 right-4 h-11 w-11 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${
                              added ? "bg-emerald-500 text-white scale-110" : "bg-white text-black hover:bg-black hover:text-white translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                            }`}
                          >
                            {added ? <Check className="h-5 w-5" strokeWidth={3} /> : <ShoppingCart className="h-5 w-5" />}
                          </button>
                        </div>

                        <div className="px-2 flex flex-col flex-1 pb-2">
                          <h3 className="font-bold text-lg leading-tight mb-1">{product.title}</h3>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wide">{product.storage}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-black text-black" />
                              <span className="text-xs font-bold">{product.rating}</span>
                              <span className="text-xs text-zinc-400 font-medium">({product.reviews})</span>
                            </div>
                          </div>
                          
                          <div className="mt-auto pt-4 flex items-end justify-between">
                            <div>
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold tracking-tight">£{product.price}</span>
                              </div>
                              <div className="text-sm font-bold text-zinc-400 line-through">
                                  £{product.originalPrice} new
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Diagnostic widget, Reviews, Promo, Guides ─────────────────────────── */}
      <section className="py-16 bg-white border-t border-zinc-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          
          {/* Tested. Perfected. Refurbished. (Diagnostic Widget) */}
          <div className="mb-16 bg-[#121212] text-white rounded-[32px] p-6 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-accent/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 max-w-3xl mb-8">
              <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">Our testing standards</span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Tested. Perfected. Refurbished.</h2>
              <p className="text-zinc-400 text-sm md:text-base font-semibold leading-relaxed">
                Every device on TechStop Leicester undergoes a rigorous 90-point diagnostic check before being certified for sale. Select a component below to see what our engineers test:
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
              {/* Left Column - Diagnostics Tabs */}
              <div className="lg:col-span-4 flex flex-col gap-2">
                {DIAGNOSTIC_STEPS.map((step) => {
                  const isActive = selectedDiagnostic === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setSelectedDiagnostic(step.id)}
                      className={`w-full text-left px-5 py-4 rounded-[20px] font-bold text-sm flex items-center justify-between transition-all ${
                        isActive ? "bg-accent text-black shadow-lg scale-[1.02]" : "bg-white/5 text-zinc-300 hover:bg-white/10"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        {React.createElement(step.icon, { className: "h-5 w-5" })}
                        {step.label}
                      </span>
                      {isActive && <span className="h-2 w-2 rounded-full bg-black"></span>}
                    </button>
                  );
                })}
              </div>

              {/* Right Column - Diagnostic Details Card */}
              <div className="lg:col-span-8 bg-white/5 border border-white/10 rounded-[24px] p-6 md:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    {(() => {
                      const activeStep = DIAGNOSTIC_STEPS.find(s => s.id === selectedDiagnostic);
                      return activeStep ? React.createElement(activeStep.icon, { className: "h-5 w-5 text-accent" }) : null;
                    })()}
                    {DIAGNOSTIC_STEPS.find(s => s.id === selectedDiagnostic)?.label} check
                  </h3>
                  <p className="text-zinc-400 text-sm mb-6 leading-relaxed font-semibold">
                    {DIAGNOSTIC_STEPS.find(s => s.id === selectedDiagnostic)?.description}
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {DIAGNOSTIC_STEPS.find(s => s.id === selectedDiagnostic)?.checks.map((checkText) => (
                      <div key={checkText} className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          ✓
                        </span>
                        <span className="text-xs font-bold text-zinc-200">{checkText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Certified 100% Functional</span>
                  </div>
                  <Link href="/how-it-works" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                    Learn about our grading system →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof reviews carousel */}
          <div className="mb-16">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Over 15M customers globally</h2>
                <p className="text-zinc-500 font-medium text-sm">Here is what our verified buyers say about TechStop Leicester.</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 bg-zinc-50 border border-zinc-200 px-4 py-2 rounded-2xl">
                <span className="font-extrabold text-2xl text-zinc-950">4.8</span>
                <div className="flex items-center text-black">
                  <Star className="h-5 w-5 fill-black text-black" strokeWidth={3} />
                  <Star className="h-5 w-5 fill-black text-black" strokeWidth={3} />
                  <Star className="h-5 w-5 fill-black text-black" strokeWidth={3} />
                  <Star className="h-5 w-5 fill-black text-black" strokeWidth={3} />
                  <Star className="h-5 w-5 fill-black text-black" strokeWidth={3} />
                </div>
                <span className="text-zinc-400 text-xs font-semibold ml-1">(over 42,000 reviews)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {MOCK_REVIEWS.map((rev) => (
                <div key={rev.id} className="flex flex-col group">
                  
                  {/* Top Portion: Photo with text & badge overlay */}
                  <div className="aspect-[4/5] rounded-t-[24px] overflow-hidden relative bg-zinc-900 shadow-sm">
                    <img
                      src={rev.image}
                      alt={`${rev.name}'s reviewed device`}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"></div>
                    
                    {/* Top-left reviewer name badge */}
                    <span className="absolute top-3.5 left-3.5 bg-white text-zinc-900 text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow-sm">
                      {rev.name}
                    </span>

                    {/* Review text & stars overlay */}
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <p className="text-white text-xs md:text-sm font-semibold leading-relaxed mb-3 drop-shadow-sm line-clamp-4">
                        "{rev.text}"
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center text-white">
                          <Star className="h-3.5 w-3.5 fill-white text-white" strokeWidth={3} />
                          <Star className="h-3.5 w-3.5 fill-white text-white" strokeWidth={3} />
                          <Star className="h-3.5 w-3.5 fill-white text-white" strokeWidth={3} />
                          <Star className="h-3.5 w-3.5 fill-white text-white" strokeWidth={3} />
                          <Star className="h-3.5 w-3.5 fill-white text-white" strokeWidth={3} />
                        </div>
                        <span className="text-[10px] font-extrabold text-white/90">5/5</span>
                      </div>
                    </div>

                  </div>

                  {/* Bottom Portion: White bar with product thumbnail & specs */}
                  <div className="bg-white border-x border-b border-zinc-200 rounded-b-[24px] p-3 flex items-center gap-3">
                    <img
                      src={rev.thumbnail}
                      alt={rev.model}
                      className="w-9 h-9 object-contain rounded-lg bg-zinc-50 border border-zinc-150 shrink-0 p-1"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold text-zinc-700 leading-tight line-clamp-2 block hover:text-black transition-colors">
                        {rev.model}
                      </span>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Double Promo Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="bg-[#e4ecf9] text-[#122e5a] rounded-[32px] p-8 flex flex-col justify-between items-start group relative overflow-hidden min-h-[260px]">
              <div className="absolute top-0 right-0 w-72 h-72 bg-blue-400/25 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 animate-pulse"></div>
              <div className="relative z-10 max-w-md">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#1e4fa8] mb-2 block">Trade-in Service</span>
                <h3 className="font-extrabold text-3xl mb-3 leading-tight">Swap your old tech for cash in hand</h3>
                <p className="text-[#3b598c] font-semibold text-sm leading-relaxed mb-6">
                  Get a trade-in offer instantly online or drop by our Leicester store to cash out your pre-loved phone or laptop.
                </p>
              </div>
              <Link href="/sell" className="h-12 px-6 rounded-full bg-black text-white font-bold flex items-center gap-2 hover:scale-105 transition-transform relative z-10 text-sm">
                Get an offer <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="bg-[#fcf3dc] text-[#5b4009] rounded-[32px] p-8 flex flex-col justify-between items-start group relative overflow-hidden min-h-[260px]">
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-amber-400/25 rounded-full blur-3xl translate-y-1/3 translate-x-1/3 animate-pulse"></div>
              <div className="relative z-10 max-w-md">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#a87f1e] mb-2 block">Local Experts</span>
                <h3 className="font-extrabold text-3xl mb-3 leading-tight">Leicester-based technical support</h3>
                <p className="text-[#8c6b24] font-semibold text-sm leading-relaxed mb-6">
                  Got questions about grading, setting up your device, or choosing a model? Our diagnostic technicians are always here to help.
                </p>
              </div>
              <Link href="/help" className="h-12 px-6 rounded-full bg-black text-white font-bold flex items-center gap-2 hover:scale-105 transition-transform relative z-10 text-sm">
                Visit Help Centre <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Buying Guides / Blogs */}
          {BUYING_GUIDES[categorySlug] && (
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-6">The more you know</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {BUYING_GUIDES[categorySlug].map((guide, idx) => (
                  <Link key={idx} href="/help" className="group block">
                    <div className="bg-white border border-zinc-200 rounded-[28px] overflow-hidden hover:border-black hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                      <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                        <img src={guide.image} alt={guide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                          {guide.readTime}
                        </span>
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-lg leading-tight mb-2 text-zinc-950 group-hover:text-black">{guide.title}</h3>
                        <p className="text-zinc-500 text-xs font-semibold leading-relaxed line-clamp-2">
                          {guide.desc}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── FAQ & SEO Buying Guide Block ───────────────────────────────────────── */}
      <div className="bg-white border-t border-zinc-200 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why buy refurbished {meta.plural.toLowerCase()}?</h2>
            <p className="text-zinc-500 font-medium text-lg">Everything you need to know about our rigorous testing and grading process.</p>
          </div>
          
          <div className="space-y-4 mb-16">
            {[
              { q: `Are these ${meta.plural.toLowerCase()} fully tested?`, a: `Yes, every single item goes through a 90-point inspection process by our certified technicians before being sold.` },
              { q: "What does the 2-year warranty cover?", a: "Our warranty covers all software and hardware defects. If your device develops a fault, we will repair or replace it for free." },
              { q: "How long does shipping take?", a: "We offer free express shipping on all orders. Most orders arrive within 1-2 business days." }
            ].map((faq, i) => (
              <div key={i} className="border border-zinc-200 rounded-[24px] overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between bg-white hover:bg-zinc-50 transition-colors"
                >
                  <span className="font-bold text-lg text-left">{faq.q}</span>
                  <ChevronDown className={`h-5 w-5 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: "auto" }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-zinc-50"
                    >
                      <div className="p-6 pt-0 text-zinc-600 font-medium">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Detailed SEO Buying Guide text block */}
          {SEO_TEXT[categorySlug] && (
            <div className="border-t border-zinc-200 pt-16">
              <h2 className="text-xl font-extrabold text-zinc-900 mb-6">{SEO_TEXT[categorySlug].title}</h2>
              <div className="space-y-4 text-xs md:text-sm font-semibold text-zinc-500 leading-relaxed">
                {SEO_TEXT[categorySlug].content.map((pText, i) => (
                  <p key={i}>{pText}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Trust bar ────────────────────────────────────────────────────────── */}
      <div className="border-t border-zinc-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap justify-center gap-12 md:gap-24">
          {[
            { icon: ShieldCheck, text: "2-Year Warranty" },
            { icon: Zap,         text: "Free Express Shipping" },
            { icon: RefreshCw,   text: "30-Day Returns" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                 <Icon className="h-5 w-5 text-black" />
              </div>
              <span className="text-sm font-bold">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile filter drawer ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end"
            onClick={() => setShowFilters(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-[340px] h-full bg-white p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-2xl">Filters</h3>
                <button onClick={() => setShowFilters(false)} className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                <div>
                  <h4 className="font-bold text-lg mb-4">Brand</h4>
                  <div className="space-y-4">
                    {meta.brands.map(brand => (
                      <label key={brand} className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => toggleFilter(brand, activeBrands, setActiveBrands)} className={`h-6 w-6 rounded border-2 flex items-center justify-center ${activeBrands.includes(brand) ? "border-black bg-black" : "border-zinc-300"}`}>
                          {activeBrands.includes(brand) && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                        </div>
                        <span className="font-bold">{brand}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-zinc-200">
                  <h4 className="font-bold text-lg mb-4">Condition</h4>
                  <div className="space-y-4">
                    {GRADES.map(g => (
                      <label key={g} className="flex items-center gap-3 cursor-pointer">
                        <div onClick={() => toggleFilter(g, activeGrades, setActiveGrades)} className={`h-6 w-6 rounded border-2 flex items-center justify-center ${activeGrades.includes(g) ? "border-black bg-black" : "border-zinc-300"}`}>
                          {activeGrades.includes(g) && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                        </div>
                        <span className="font-bold">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-200 mt-auto">
                <button onClick={() => setShowFilters(false)} className="w-full h-14 rounded-full bg-black text-white font-bold text-lg">
                  Show {filtered.length} results
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
