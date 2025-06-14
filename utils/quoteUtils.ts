import { Quote, quotes } from '@/data/quotes';

export function getRandomQuote(): Quote {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

export function getQuoteOfTheDay(): Quote {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const index = dayOfYear % quotes.length;
  return quotes[index];
} 