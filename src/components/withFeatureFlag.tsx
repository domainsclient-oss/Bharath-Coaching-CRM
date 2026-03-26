
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import centerConfig from '../config/centerConfig';
import { useEffect } from 'react';

const FeatureDisabledPage = () => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-2xl font-bold mb-4">Feature Not Available</h1>
        <p className="text-muted-foreground">
            This feature has been disabled by the administrator. 
            Please contact support if you believe this is an error.
        </p>
    </div>
);

export function withFeatureFlag<P extends React.JSX.IntrinsicAttributes>(
    WrappedComponent: React.ComponentType<P>,
    feature: keyof typeof centerConfig.features
) {
    const ComponentWithFeature = (props: P) => {
        const router = useRouter();
        const isFeatureEnabled = centerConfig.features[feature];

        useEffect(() => {
            if (!isFeatureEnabled) {
                // You might want to redirect to a specific page
                // For now, we'll just show a disabled message.
            }
        }, [isFeatureEnabled, router]);

        return isFeatureEnabled ? <WrappedComponent {...props} /> : <FeatureDisabledPage />;
    };

    // Assign a display name for better debugging
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
    ComponentWithFeature.displayName = `withFeatureFlag(${displayName})`;

    return ComponentWithFeature;
}
