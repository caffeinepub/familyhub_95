import React, { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { LoginPage } from "./components/LoginPage";
import { LoadingScreen } from "./components/LoadingScreen";
import { AuthenticatedApp } from "./components/AuthenticatedApp";
import { useFamilyStatus } from "./hooks/useQueries";
import { useActor } from "./hooks/useActor";
import { ThemeProvider } from "./providers/ThemeProvider";

const App: React.FC = () => {
  const { identity, isInitializing, clear: logout } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const queryClient = useQueryClient();

  // Clear query cache on logout
  useEffect(() => {
    if (!identity) {
      queryClient.clear();
    }
  }, [identity, queryClient]);

  const { actor, isFetching: isActorFetching } = useActor();

  const {
    data: familyStatus,
    isLoading: isLoadingStatus,
    refetch: refetchStatus,
  } = useFamilyStatus();

  // Determine which content to render
  let content: React.ReactNode;

  if (isInitializing) {
    // Initializing identity - show loading screen
    content = <LoadingScreen />;
  } else if (!isAuthenticated) {
    // Not authenticated - show login page
    content = <LoginPage />;
  } else if (!actor || isActorFetching || isLoadingStatus || !familyStatus) {
    // Loading actor or family status - show loading screen
    // Only check initial loading (isLoading), NOT refetching (isFetching)
    // This prevents unmounting AuthenticatedApp during refetches
    content = <LoadingScreen />;
  } else {
    // Authenticated and family status loaded - show authenticated app
    // Key ensures component remounts and resets local state when identity changes
    content = (
      <AuthenticatedApp
        key={identity?.getPrincipal().toString()}
        familyStatus={familyStatus}
        refetchStatus={refetchStatus}
        onLogout={logout}
      />
    );
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      forcedTheme="light"
      enableSystem={false}
    >
      {content}
    </ThemeProvider>
  );
};

export default App;
