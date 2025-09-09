import { useState, useEffect } from 'react';

const FREE_ARTICLES_KEY = 'guest_articles_read';
const MAX_FREE_ARTICLES = 1;

export const useFreeArticle = () => {
  const [guestArticlesUsed, setGuestArticlesUsed] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem(FREE_ARTICLES_KEY);
    setGuestArticlesUsed(stored ? parseInt(stored, 10) : 0);
  }, []);

  const markArticleAsRead = () => {
    const newCount = guestArticlesUsed + 1;
    setGuestArticlesUsed(newCount);
    localStorage.setItem(FREE_ARTICLES_KEY, newCount.toString());
  };

  const canReadFreeArticle = () => {
    return guestArticlesUsed < MAX_FREE_ARTICLES;
  };

  const resetFreeArticles = () => {
    setGuestArticlesUsed(0);
    localStorage.removeItem(FREE_ARTICLES_KEY);
  };

  return {
    guestArticlesUsed,
    canReadFreeArticle,
    markArticleAsRead,
    resetFreeArticles,
    maxFreeArticles: MAX_FREE_ARTICLES
  };
};