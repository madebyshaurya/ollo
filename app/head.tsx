export default function Head() {
    const videoUrl = "https://hc-cdn.hel1.your-objectstorage.com/s/v3/3ce795ad171c250112f6903187923b7a5a5b5248_video__1_.mp4";
    const videoHost = "https://hc-cdn.hel1.your-objectstorage.com";

    return (
        <>
            {/* Hint DNS and connection to the video CDN early */}
            <link rel="dns-prefetch" href="//hc-cdn.hel1.your-objectstorage.com" />
            <link rel="preconnect" href={videoHost} crossOrigin="" />

            {/* Preload the hero video so it starts as early as possible */}
            <link
                rel="preload"
                as="video"
                href={videoUrl}
                type="video/mp4"
                fetchPriority="high"
            />
        </>
    );
}


