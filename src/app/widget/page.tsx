'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatWidget, { WidgetConfig } from '@/components/widget/ChatWidget';

function WidgetFrameContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<WidgetConfig>({});

  useEffect(() => {
    // 1. Parse configuration from search params
    const rawConfig = searchParams.get('config');
    let parsedConfig: WidgetConfig = {};

    if (rawConfig) {
      try {
        parsedConfig = JSON.parse(decodeURIComponent(rawConfig));
      } catch (e) {
        console.warn('Failed to parse config query param:', e);
      }
    }

    // Override with direct query parameters if provided
    const brandColor = searchParams.get('brandColor') || parsedConfig.brandColor;
    const position = (searchParams.get('position') as any) || parsedConfig.position;
    const logoUrl = searchParams.get('logoUrl') || parsedConfig.logoUrl;
    const companyName = searchParams.get('companyName') || parsedConfig.companyName;
    const welcomeText = searchParams.get('welcomeText') || parsedConfig.welcomeText;
    const autoGreetingDelaySeconds = searchParams.get('delay')
      ? parseInt(searchParams.get('delay')!, 10)
      : parsedConfig.autoGreetingDelaySeconds;
    const workspaceId = searchParams.get('workspaceId') || parsedConfig.workspaceId;

    setConfig({
      ...parsedConfig,
      ...(brandColor && { brandColor }),
      ...(position && { position }),
      ...(logoUrl && { logoUrl }),
      ...(companyName && { companyName }),
      ...(welcomeText && { welcomeText }),
      ...(autoGreetingDelaySeconds !== undefined && { autoGreetingDelaySeconds }),
      ...(workspaceId && { workspaceId }),
    });

    // 2. Listen to postMessage from parent host window
    const handleParentMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;
      if (event.data.type === 'chatify_update_config') {
        setConfig((prev) => ({ ...prev, ...event.data.config }));
      }
    };

    window.addEventListener('message', handleParentMessage);
    return () => window.removeEventListener('message', handleParentMessage);
  }, [searchParams]);

  const handleClose = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'chatify_close' }, '*');
    }
  };

  const handleUnreadChange = (count: number) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'chatify_unread_count', count }, '*');
    }
  };

  return (
    <div className="w-screen h-screen bg-transparent overflow-hidden flex flex-col">
      <ChatWidget
        config={config}
        mode="window-only"
        onClose={handleClose}
        onUnreadChange={handleUnreadChange}
      />
    </div>
  );
}

export default function WidgetPage() {
  return (
    <Suspense fallback={<div className="w-screen h-screen bg-transparent" />}>
      <WidgetFrameContent />
    </Suspense>
  );
}
