import crypto from "crypto";
import { Inter } from "next/font/google";
import { Bucket } from "sst/node/bucket";
import styles from "@/styles/Home.module.css";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { useState } from "react";
import Parallax from "../components/Parallax";

const inter = Inter({ subsets: ["latin"] });

export async function getServerSideProps() {
  const command = new PutObjectCommand({
    ACL: "public-read",
    Key: crypto.randomUUID(),
    Bucket: Bucket.public.bucketName,
  });
  const url = await getSignedUrl(new S3Client({}), command);

  return { props: { url } };
}

export default function Home({ url }: { url: string }) {
  
  const [message, setMessage] = useState("Hi 👋");
  const lambdaUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!lambdaUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is undefined");
  }
  function onClick() {
    fetch(lambdaUrl!)
      .then((response) => response.text())
      .then(setMessage);
  }

  return (
    <>
      <Parallax />
      <div className="">
        <button onClick={onClick}>
          Message is "<i>{message}</i>"
        </button>
      </div>
      <form
        className={styles.form}
        onSubmit={async (e) => {
          e.preventDefault();

          const file = (e.target as HTMLFormElement).file.files?.[0]!;

          const image = await fetch(url, {
            body: file,
            method: "PUT",
            headers: {
              "Content-Type": file.type,
              "Content-Disposition": `attachment; filename="${file.name}"`,
            },
          });

          window.location.href = image.url.split("?")[0];
        }}
      >
        <input name="file" type="file" accept="image/png, image/jpeg" />
        <button type="submit" className={inter.className}>
          Upload
        </button>
      </form>
    </>
  );
}
