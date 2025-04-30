'use client';

import type { IntegrationIdentifier } from '@acme/db/schema';
import { CustomDialog } from '@acme/ui/components/CustomDialog';
import CustomLink from '@acme/ui/components/CustomLink';
import { Button } from '@acme/ui/components/ui/button';
import { Input } from '@acme/ui/components/ui/input';
import { Label } from '@acme/ui/components/ui/label';
import { cn } from '@acme/ui/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import pluralize from 'pluralize';
import { useCallback, useMemo, useRef, useState } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';

import { api } from '~/trpc/client';

import AccountsList from './accounts-list';
import ReposList from './repos-list';

export default function IntegrationDetails({ provider }: { provider: IntegrationIdentifier }) {
  const [showManualModal, setShowManualModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [manualUsername, setManualUsername] = useState('');
  const [manualInfo, setManualInfo] = useState<{ link: string | null; token: string | null }>({ link: null, token: null });
  const [selectedTab, setSelectedTab] = useState('accounts');
  const integrationQuery = api.integrations.integrationSettingsForCurrentUser.useQuery({ provider });
  const manualInfoMut = api.integrations.manualIntegrationInfo.useMutation({
    onSuccess: setManualInfo,
  });
  const verifyManualIntegration = api.integrations.verifyManualIntegration.useMutation();

  const tabs = useMemo(
    (): { id: string; label: string }[] => [
      {
        id: 'accounts',
        label: 'Accounts',
      },
      // ...(['github', 'gitlab', IntegrationIdentifier.bitbucket].includes(provider)
      ...(['github', 'gitlab'].includes(provider)
        ? [
            {
              id: 'repos',
              label: 'Repositories',
            },
          ]
        : []),
    ],
    [provider],
  );

  const onClickManual = useCallback(() => {
    setShowManualModal(true);
    inputRef.current?.focus();
  }, [inputRef]);

  const onChangeManualUsername = useCallback(
    (username: string) => {
      setManualUsername(username);
      manualInfoMut.mutate({ provider, username: username });
    },
    [provider, manualInfoMut],
  );

  const connectAnother = useCallback(() => {
    if (!integrationQuery.isSuccess) {
      return;
    }
    if (integrationQuery.data.isManualValidation) {
      onClickManual();
      return;
    }

    if (typeof window === 'undefined') {
      return;
    }

    const newWindowHeight = screen.height * 0.7;
    const newWindowWidth = screen.height > 900 ? 900 : screen.height * 0.9;
    const x = screen.width / 2 - newWindowWidth / 2;
    const y = screen.height / 2 - newWindowHeight / 2;
    window.open(integrationQuery.data.oauthUrl, 'wonderful', `height=${newWindowHeight},width=${newWindowWidth},left=+${x}+,top=+${y}`);
  }, [integrationQuery.data?.isManualValidation, integrationQuery.data?.oauthUrl, integrationQuery.isSuccess, onClickManual]);

  const onClickVerify = useCallback(async () => {
    const res = await verifyManualIntegration.mutateAsync({ provider, username: manualUsername });
    if (res.ok) {
      setShowManualModal(false);
      void integrationQuery.refetch();
    }
  }, [integrationQuery, manualUsername, provider, verifyManualIntegration]);

  if (integrationQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-8">
        <LuLoaderCircle className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (integrationQuery.isError) {
    return (
      <div className="p-4">
        <p className="text-muted-foreground">{integrationQuery.error.message}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center border-b px-4 py-8">
        {integrationQuery.data.icon ? (
          <span className="fill-foreground mb-4 h-12 w-12" dangerouslySetInnerHTML={{ __html: integrationQuery.data.icon }} />
        ) : null}
        <p className="text-center text-xl font-bold">{integrationQuery.data.name}</p>
        <p className="text-muted-foreground mt-2 text-center">{integrationQuery.data.description}</p>
        <div className="mt-2 flex items-center gap-4">
          <p>
            <span className="font-medium">{integrationQuery.data.connections.length}</span>{' '}
            <span className="text-muted-foreground">connected {pluralize('account', integrationQuery.data.connections.length)}</span>
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          <Button onClick={connectAnother} variant="outline">
            {integrationQuery.data.isConnected ? 'Connect another account' : 'Connect account'}
          </Button>
        </div>
      </div>
      {integrationQuery.data.connections.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-muted-foreground">No connected accounts</p>
        </div>
      ) : (
        <Tabs value={selectedTab}>
          {tabs.length > 1 && (
            <TabsList className="bg-card sticky top-14 z-20 flex h-12 w-full border-b">
              {tabs.map((tab) => {
                const selected = tab.id === selectedTab;
                return (
                  <TabsTrigger
                    className={cn(
                      'text-muted-foreground hover:bg-secondary/80 hover:text-accent-foreground relative flex flex-1 items-center justify-center',
                      {
                        'text-accent-foreground': selected,
                      },
                    )}
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id)}
                    value={tab.id}
                  >
                    <div className="relative flex h-full items-center">
                      {tab.label}
                      <div
                        className={cn('bg-primary absolute right-0 bottom-0 left-0 h-1 rounded-full opacity-0', {
                          'opacity-100': selected,
                        })}
                      />
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          )}
          <TabsContent value="accounts">
            <AccountsList connections={integrationQuery.data.connections} provider={provider} />
          </TabsContent>
          <TabsContent value="repos">
            <ReposList provider={provider} />
          </TabsContent>
        </Tabs>
      )}

      <CustomDialog
        footer={
          <Button
            className="btn-sm mt-4"
            disabled={!manualInfo.token || verifyManualIntegration.isPending}
            onClick={onClickVerify}
            type="submit"
            variant={verifyManualIntegration.data?.error ? 'destructive' : 'default'}
          >
            {verifyManualIntegration.isPending ? <LuLoaderCircle className="animate-spin" /> : null}
            Verify
          </Button>
        }
        onOpenChange={setShowManualModal}
        open={showManualModal}
        title={`Connect ${integrationQuery.data.name}`}
      >
        <div className="px-6">
          <fieldset>
            <Label>Enter your {integrationQuery.data.name} username</Label>
            <Input onChange={(e) => onChangeManualUsername(e.target.value)} placeholder="Username" ref={inputRef} value={manualUsername} />
          </fieldset>
          {manualInfo.token && manualInfo.link ? (
            <fieldset className="pt-2">
              <Label>Add the verification code to your {integrationQuery.data.name} profile</Label>
              <Input readOnly value={manualInfo.token} />
              <p className="text-muted-foreground mt-2 text-sm">
                Open{' '}
                <CustomLink className="hover:text-primary underline-offset-4 hover:underline" href={manualInfo.link} isExternal={true}>
                  {manualInfo.link}
                </CustomLink>
              </p>
            </fieldset>
          ) : null}
          {manualInfo.token && verifyManualIntegration.data?.error ? (
            <p className="mt-2 text-sm">{verifyManualIntegration.data.error}</p>
          ) : null}
        </div>
      </CustomDialog>
    </>
  );
}
