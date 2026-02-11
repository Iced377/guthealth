'use client';

import dynamic from 'next/dynamic';

const WalkthroughOverlay = dynamic(() => import('@/components/walkthrough/WalkthroughOverlay'), { ssr: false });
const WalkthroughStage = dynamic(() => import('@/components/walkthrough/WalkthroughStage'), { ssr: false });

export default function WalkthroughLazyClient() {
  return (
    <>
      <WalkthroughStage />
      <WalkthroughOverlay />
    </>
  );
}
