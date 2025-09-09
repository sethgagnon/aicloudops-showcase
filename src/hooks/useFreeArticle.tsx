import { useState, useEffect } from 'react';

const FREE_ARTICLES_KEY = 'guest_articles_read';
const MAX_FREE_ARTICLES = 1;

export const useFreeArticle = () => {
  const [guestArticlesUsed, setGuestArticlesUsed] = useState(() => {
    const stored = localStorage.getItem(FREE_ARTICLES_KEY);
    return stored ? parseInt(stored, 10) : 0;
  });


  const markArticleAsRead = () => {
    const newCount = guestArticlesUsed + 1;
    setGuestArticlesUsed(newCount);
    localStorage.setItem(FREE_ARTICLES_KEY, newCount.toString());
  };

  const canReadFreeArticle = () => {
    console.log('canReadFreeArticle check:', { guestArticlesUsed, MAX_FREE_ARTICLES, result: guestArticlesUsed < MAX_FREE_ARTICLES });
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