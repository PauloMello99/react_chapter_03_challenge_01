import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { FaCalendarDay, FaUserAlt } from 'react-icons/fa';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { useRouter } from 'next/router';
import { getPrismicClient } from '../services/prismic';

import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const router = useRouter();
  const [nextPage, setNextPage] = useState<string | null>(
    postsPagination.next_page
  );
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  const handleLoadMoreClick: () => void = async () => {
    const raw = await fetch(nextPage);
    const response = await raw.json();
    const { next_page, results } = response;

    const formattedResults: Post[] = results.map(
      ({ uid, data, first_publication_date }) => ({
        uid,
        first_publication_date: format(
          new Date(first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
        ),
        data,
      })
    );

    setNextPage(next_page);
    setPosts(old => [...old, ...formattedResults]);
  };

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <main className={styles.container}>
        <div className={styles.posts}>
          {posts.map(post => {
            const formattedDate = format(
              new Date(post.first_publication_date),
              'dd MMM yyyy',
              { locale: ptBR }
            );

            const handleButtonClick: () => void = () =>
              router.push(`/post/${post.uid}`, `/post/${post.uid}`, {
                locale: 'pt-BR',
              });

            return (
              <button key={post.uid} type="button" onClick={handleButtonClick}>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <div>
                    <FaCalendarDay />
                    <time>{formattedDate}</time>
                  </div>
                  <div>
                    <FaUserAlt />
                    <p>{post.data.author}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {!!nextPage && (
          <button
            type="button"
            onClick={handleLoadMoreClick}
            className={styles.loadMore}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps<HomeProps> = async () => {
  try {
    const prismic = getPrismicClient();
    const { next_page, results } = await prismic.query(
      [Prismic.Predicates.at('document.type', 'post')],
      {
        fetch: ['post.title', 'post.subtitle', 'post.author'],
      }
    );

    return {
      props: { postsPagination: { next_page, results } },
    };
  } catch (error) {
    return {
      props: { postsPagination: { next_page: null, results: [] } },
    };
  }
};
