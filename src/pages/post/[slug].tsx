import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Prismic from '@prismicio/client';
import { FaCalendarDay, FaUserAlt, FaClock } from 'react-icons/fa';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Content {
  heading: string;
  body: { text: string }[];
}

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: { url: string };
    author: string;
    content: Content[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();

  if (router.isFallback) {
    return (
      <>
        <Head>
          <title>{post?.data?.title || 'Post'}</title>
        </Head>
        <main className={styles.content}>Carregando...</main>
      </>
    );
  }

  const estimatedTime =
    post?.data?.content.reduce((contentAcc, content) => {
      const words = content.body.reduce(
        (bodyAcc, body) => body.text.split(' ').length + bodyAcc,
        0
      );

      return contentAcc + Math.ceil(words / 200);
    }, 0) || 0;

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <Head>
        <title>{post?.data?.title || 'Post'}</title>
      </Head>
      <main className={styles.container}>
        <img src={post?.data?.banner?.url} alt="banner" />
        <article className={styles.content}>
          <h1>{post?.data?.title}</h1>
          <div className={styles.postInfo}>
            <div>
              <FaCalendarDay />
              <time>{formattedDate}</time>
            </div>
            <div>
              <FaUserAlt />
              <p>{post?.data?.author}</p>
            </div>
            <div>
              <FaClock />
              <time>{estimatedTime} min</time>
            </div>
          </div>
          {post?.data?.content?.map((content, sIndex) => (
            <section
              key={`section_${sIndex.toString()}`}
              className={styles.section}
            >
              <h2>{content?.heading}</h2>
              {content?.body?.map((body, cIndex) => (
                <div
                  key={`content_body_${cIndex.toString()}`}
                  dangerouslySetInnerHTML={{ __html: body.text }}
                />
              ))}
            </section>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const { results } = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    { fetch: ['post.uid'] }
  );

  return {
    fallback: true,
    paths: results.map(result => ({ params: { slug: result.uid } })),
  };
};

export const getStaticProps: GetStaticProps<PostProps> = async context => {
  try {
    const { params } = context;
    const { slug } = params;

    const prismic = getPrismicClient();
    const response = await prismic.getByUID('post', String(slug), {});

    const { first_publication_date, data, uid } = response;
    const { title, author, banner, content, subtitle } = data;

    const post: Post = {
      uid,
      data: { title, subtitle, author, banner, content },
      first_publication_date,
    };

    return { props: { post } };
  } catch (error) {
    return { props: { post: {} as Post } };
  }
};
