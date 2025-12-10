import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { getDisplayNameForModel } from "@/lib/hooks";
import { parseLlmDescriptor, structureValue } from "@/lib/llm/utils";
import { setUserDefaultModel } from "@/lib/users/UserSettings";
import { usePathname, useRouter } from "next/navigation";
import { usePopup } from "@/components/admin/connectors/Popup";
import { useUser } from "@/components/user/UserProvider";
import { ThemePreference } from "@/lib/types";
import { Switch } from "@/components/ui/switch";
import { SubLabel } from "@/components/Field";
import { SettingsContext } from "@/components/settings/SettingsProvider";
import { LLMSelector } from "@/components/llm/LLMSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Button from "@/refresh-components/buttons/Button";
import { Input } from "@/components/ui/input";
import { deleteAllChatSessions } from "@/app/chat/services/lib";
import { SourceIcon } from "@/components/SourceIcon";
import { ValidSources } from "@/lib/types";
import { getSourceMetadata } from "@/lib/sources";
import SvgTrash from "@/icons/trash";
import SvgExternalLink from "@/icons/external-link";
import { useFederatedOAuthStatus } from "@/lib/hooks/useFederatedOAuthStatus";
import { useCCPairs } from "@/lib/hooks/useCCPairs";
import { useLLMProviders } from "@/lib/hooks/useLLMProviders";
import { useUserPersonalization } from "@/lib/hooks/useUserPersonalization";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";

type SettingsSection =
  | "settings"
  | "password"
  | "connectors"
  | "personalization";

interface UserSettingsProps {
  onClose: () => void;
}

export function UserSettings({ onClose }: UserSettingsProps) {
  const {
    refreshUser,
    user,
    updateUserAutoScroll,
    updateUserShortcuts,
    updateUserTemperatureOverrideEnabled,
    updateUserPersonalization,
    updateUserThemePreference,
  } = useUser();
  const { llmProviders } = useLLMProviders();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isModelUpdating, setIsModelUpdating] = useState(false);
  const [activeSection, setActiveSection] =
    useState<SettingsSection>("settings");
  // show updates in the UI instantly without waiting for an API call to finish
  const [currentDefaultModel, setCurrentDefaultModel] = useState<string | null>(
    null
  );
  const [isDeleteAllLoading, setIsDeleteAllLoading] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState<number | null>(null);
  const { popup, setPopup } = usePopup();

  // Fetch federated-connector info so the modal can list/refresh them
  const {
    connectors: federatedConnectors,
    refetch: refetchFederatedConnectors,
  } = useFederatedOAuthStatus();

  const { ccPairs } = useCCPairs();

  const defaultModel = user?.preferences?.default_model;

  // Initialize currentDefaultModel from user preferences
  useEffect(() => {
    if (currentDefaultModel === null && defaultModel) {
      setCurrentDefaultModel(defaultModel);
    }
  }, [defaultModel, currentDefaultModel]);

  // Use currentDefaultModel for display, falling back to defaultModel
  const displayModel = currentDefaultModel ?? defaultModel;

  const hasConnectors =
    (ccPairs && ccPairs.length > 0) ||
    (federatedConnectors && federatedConnectors.length > 0);

  const showPasswordSection = Boolean(user?.password_configured);

  const {
    personalizationValues,
    updatePersonalizationField,
    toggleUseMemories,
    updateMemoryAtIndex,
    addMemory,
    handleSavePersonalization,
    isSavingPersonalization,
  } = useUserPersonalization(user, updateUserPersonalization, {
    onSuccess: () =>
      setPopup({
        message: "Personalisierung erfolgreich",
        type: "success",
      }),
    onError: () =>
      setPopup({
        message: "Personalisierung nicht erfolgreich",
        type: "error",
      }),
  });

  const sections = useMemo(() => {
    const visibleSections: { id: SettingsSection; label: string }[] = [
      { id: "settings", label: "Einstellungen" },
      { id: "personalization", label: "Personalisierung" },
    ];

    if (showPasswordSection) {
      visibleSections.push({ id: "password", label: "Passwort" });
    }

    {/*if (hasConnectors) {
      visibleSections.push({ id: "connectors", label: "Connectors" });
    }*/}

    return visibleSections;
  }, [showPasswordSection, hasConnectors]);

  useEffect(() => {
    if (!sections.some((section) => section.id === activeSection)) {
      setActiveSection(sections[0]?.id ?? "settings");
    }
  }, [sections, activeSection]);

  useEffect(() => {
    const container = containerRef.current;
    const message = messageRef.current;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);

    if (container && message) {
      const checkScrollable = () => {
        if (container.scrollHeight > container.clientHeight) {
          message.style.display = "block";
        } else {
          message.style.display = "none";
        }
      };
      checkScrollable();
      window.addEventListener("resize", checkScrollable);
      return () => {
        window.removeEventListener("resize", checkScrollable);
        window.removeEventListener("keydown", handleEscape);
      };
    }

    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  const defaultModelDestructured = defaultModel
    ? parseLlmDescriptor(defaultModel)
    : null;
  const modelOptionsByProvider = new Map<
    string,
    { name: string; value: string }[]
  >();
  llmProviders.forEach((llmProvider) => {
    const providerOptions = llmProvider.model_configurations.map(
      (model_configuration) => ({
        name: getDisplayNameForModel(model_configuration.name),
        value: model_configuration.name,
      })
    );
    modelOptionsByProvider.set(llmProvider.name, providerOptions);
  });

  const llmOptionsByProvider: {
    [provider: string]: { name: string; value: string }[];
  } = {};
  const uniqueModelNames = new Set<string>();

  llmProviders.forEach((llmProvider) => {
    if (!llmOptionsByProvider[llmProvider.provider]) {
      llmOptionsByProvider[llmProvider.provider] = [];
    }

    llmProvider.model_configurations.forEach((modelConfiguration) => {
      if (!uniqueModelNames.has(modelConfiguration.name)) {
        uniqueModelNames.add(modelConfiguration.name);
        const llmOptions = llmOptionsByProvider[llmProvider.provider];
        if (llmOptions) {
          llmOptions.push({
            name: modelConfiguration.name,
            value: structureValue(
              llmProvider.name,
              llmProvider.provider,
              modelConfiguration.name
            ),
          });
        }
      }
    });
  });

  const handleChangedefaultModel = async (defaultModel: string | null) => {
    // Update UI instantly
    setCurrentDefaultModel(defaultModel);
    setIsModelUpdating(true);

    try {
      const response = await setUserDefaultModel(defaultModel);

      if (response.ok) {
        setPopup({
          message: "Standardmodell erfolgreich angepasst",
          type: "success",
        });
        refreshUser();
        // refresh so that the new default model is reflected in the
        // LLMManager / the UI
        router.refresh();
      } else {
        // Revert on failure
        setCurrentDefaultModel(user?.preferences?.default_model ?? null);
        throw new Error("Anpassung des Standardmodells gescheitert");
      }
    } catch (error) {
      // Revert on error
      setCurrentDefaultModel(user?.preferences?.default_model ?? null);
      setPopup({
        message: "Anpassung des Standardmodells gescheitert",
        type: "error",
      });
    } finally {
      setIsModelUpdating(false);
    }
  };

  const handleConnectOAuth = (authorizeUrl: string) => {
    // Redirect to OAuth URL in the same window
    router.push(authorizeUrl);
  };

  const handleDisconnectOAuth = async (connectorId: number) => {
    setIsDisconnecting(connectorId);
    try {
      const response = await fetch(`/api/federated/${connectorId}/oauth`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPopup({
          message: "Trennung erfolgreich",
          type: "success",
        });
        if (refetchFederatedConnectors) {
          refetchFederatedConnectors();
        }
      } else {
        throw new Error("Trennung gescheitert");
      }
    } catch (error) {
      setPopup({
        message: "Trennung gescheitert",
        type: "error",
      });
    } finally {
      setIsDisconnecting(null);
    }
  };

  const settings = useContext(SettingsContext);
  const autoScroll = settings?.settings?.auto_scroll;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPopup({ message: "Neue Passwörter stimmen nicht überein", type: "error" });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/password/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          old_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (response.ok) {
        setPopup({ message: "Passwort erfolgreich geändert", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const errorData = await response.json();
        setPopup({
          message: errorData.detail || "Bei der Passwortänderung ist ein Fehler aufgetreten",
          type: "error",
        });
      }
    } catch (error) {
      setPopup({
        message: "Bei der Passwortänderung ist ein Fehler aufgetreten",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const pathname = usePathname();

  const handleDeleteAllChats = async () => {
    setIsDeleteAllLoading(true);
    try {
      const response = await deleteAllChatSessions();
      if (response.ok) {
        setPopup({
          message: "Chatverlauf gelöscht.",
          type: "success",
        });
        // refreshChatSessions();
        if (pathname.includes("/chat")) {
          router.push("/chat");
        }
      } else {
        throw new Error("Chatverlauf konnte nicht gelöscht werden");
      }
    } catch (error) {
      setPopup({
        message: "Chatverlauf konnte nicht gelöscht werden",
        type: "error",
      });
    } finally {
      setIsDeleteAllLoading(false);
      setShowDeleteConfirmation(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {sections.length > 1 && (
        <nav>
          <ul className="flex space-x-2">
            {sections.map(({ id, label }) => (
              <li key={id}>
                <Button
                  tertiary
                  active={activeSection === id}
                  onClick={() => setActiveSection(id)}
                >
                  {label}
                </Button>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {popup}

      <div className="w-full overflow-y-auto px-1">
        {activeSection === "settings" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Erscheinungsbild</h3>
              <Select
                value={theme}
                onValueChange={(value) => {
                  setTheme(value);
                  updateUserThemePreference(value as ThemePreference);
                }}
              >
                <SelectTrigger className="w-full mt-2">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value={ThemePreference.SYSTEM}
                    icon={<Monitor className="h-4 w-4" />}
                  >
                    System
                  </SelectItem>
                  <SelectItem
                    value={ThemePreference.LIGHT}
                    icon={<Sun className="h-4 w-4" />}
                  >
                    Hell
                  </SelectItem>
                  <SelectItem icon={<Moon />} value={ThemePreference.DARK}>
                    Dunkel
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Auto-scroll</h3>
                <SubLabel>Automatisch zum neuesten Textabschnitt springen</SubLabel>
              </div>
              <Switch
                checked={user?.preferences.auto_scroll}
                onCheckedChange={(checked) => {
                  updateUserAutoScroll(checked);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Temperatur anpassen</h3>
                <SubLabel>Temperatur ('Kreativität') des LLM einstellen</SubLabel>
              </div>
              <Switch
                checked={user?.preferences.temperature_override_enabled}
                onCheckedChange={(checked) => {
                  updateUserTemperatureOverrideEnabled(checked);
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Prompt Tastenkürzel</h3>
                <SubLabel>Tastaturkürzel für Prompts aktivieren</SubLabel>
              </div>
              <Switch
                checked={user?.preferences?.shortcut_enabled}
                onCheckedChange={(checked) => {
                  updateUserShortcuts(checked);
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-medium">Standardmodell</h3>
                {isModelUpdating && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              <LLMSelector
                userSettings
                llmProviders={llmProviders}
                currentLlm={
                  displayModel
                    ? structureValue(
                        parseLlmDescriptor(displayModel).provider,
                        parseLlmDescriptor(displayModel).name,
                        parseLlmDescriptor(displayModel).modelName
                      )
                    : null
                }
                requiresImageGeneration={false}
                onSelect={(selected) => {
                  if (selected === null) {
                    handleChangedefaultModel(null);
                  } else {
                    const { modelName, provider, name } =
                      parseLlmDescriptor(selected);
                    if (modelName && name) {
                      handleChangedefaultModel(
                        structureValue(name, provider, modelName)
                      );
                    }
                  }
                }}
              />
            </div>
            <div className="pt-4 border-t border-border">
              {!showDeleteConfirmation ? (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Dieser Vorgang wird Ihre Chathistorie löschen und kann nicht 
                    rückgängig gemacht werden.
                  </p>
                  <Button
                    danger
                    onClick={() => setShowDeleteConfirmation(true)}
                    leftIcon={SvgTrash}
                  >
                    Alle Chats löschen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Sind Sie sicher, dass Sie Ihre Chathistorie löschen möchten?
                  </p>
                  <div className="flex gap-2">
                    <Button
                      danger
                      onClick={handleDeleteAllChats}
                      disabled={isDeleteAllLoading}
                    >
                      {isDeleteAllLoading ? "Löschvorgang gestartet..." : "Ja, alle Chats löschen"}
                    </Button>
                    <Button
                      secondary
                      onClick={() => setShowDeleteConfirmation(false)}
                      disabled={isDeleteAllLoading}
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeSection === "personalization" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Name</h3>
              <Input
                value={personalizationValues.name}
                onChange={(event) =>
                  updatePersonalizationField("name", event.target.value)
                }
                placeholder="Wie soll chat.BAI Sie nennen?"
                className="mt-2"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium">Beruf</h3>
              <Input
                value={personalizationValues.role}
                onChange={(event) =>
                  updatePersonalizationField("role", event.target.value)
                }
                placeholder="Spezifizieren Sie Ihren Beruf, um Ausgaben entsprechend anzupassen"
                className="mt-2"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Erinnerungen verwenden</h3>
                <SubLabel>
                  Erlauben Sie chat.BAI in zukünftigen Chats auf alte Unterhaltungen zuzugreifen.
                </SubLabel>
              </div>
              <Switch
                checked={personalizationValues.use_memories}
                onCheckedChange={(checked) => toggleUseMemories(checked)}
              />
            </div>
            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Erinnerungen</h3>
                  <SubLabel>
                    Persönliche Notizen behalten, die in zukünftigen Chats aufgegriffen werden sollen.
                  </SubLabel>
                </div>
                <Button tertiary onClick={addMemory}>
                  Erinnerung hinzufügen
                </Button>
              </div>
              {personalizationValues.memories.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Noch keine Erinnerungen gespeichert.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto flex flex-col gap-3 pr-1">
                  {personalizationValues.memories.map((memory, index) => (
                    <AutoResizeTextarea
                      key={index}
                      value={memory}
                      placeholder="Was soll chat.BAI sich merken?"
                      onChange={(value) => updateMemoryAtIndex(index, value)}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  void handleSavePersonalization();
                }}
                disabled={isSavingPersonalization}
              >
                {isSavingPersonalization
                  ? "Personalisierung wird gespeichert..."
                  : "Speichern"}
              </Button>
            </div>
          </div>
        )}
        {activeSection === "password" && (
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Passwort ändern</h3>
              <SubLabel>
                Geben Sie ihr aktuelles und neues Passwort ein, um ihr Passwort zu 
                ändern.
              </SubLabel>
            </div>
            <form onSubmit={handleChangePassword} className="w-full">
              <div className="w-full">
                <label
                  htmlFor="currentPassword"
                  className="text-sm font-medium"
                >
                  Aktuelles Passwort
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div className="w-full">
                <label htmlFor="newPassword" className="text-sm font-medium">
                  Neues Passwort
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="confirmPassword"
                  className="text-sm font-medium"
                >
                  Neues Passwort wiederholen
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end w-full">
                <Button disabled={isLoading}>
                  {isLoading ? "Passwort wird geändert..." : "Passwort ändern"}
                </Button>
              </div>
            </form>
          </div>
        )}
        {/*
        {activeSection === "connectors" && (
            <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Verbundene Dienste</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Passen Sie Ihre verbundenen Dienste an, um weiteren Kontext für 
                chat.Bai hinzuzufügen.
              </p>

              {/* Indexed Connectors Section 
              {ccPairs && ccPairs.length > 0 && (
                <div className="space-y-3 mb-6">
                  <h4 className="text-md font-medium text-muted-foreground">
                    Indexed Connectors
                  </h4>
                  {(() => {
                    // Group connectors by source
                    const groupedConnectors = ccPairs.reduce(
                      (acc, ccPair) => {
                        const source = ccPair.source;
                        if (!acc[source]) {
                          acc[source] = {
                            source,
                            count: 0,
                            hasSuccessfulRun: false,
                          };
                        }
                        acc[source]!.count++;
                        if (ccPair.has_successful_run) {
                          acc[source]!.hasSuccessfulRun = true;
                        }
                        return acc;
                      },
                      {} as Record<
                        string,
                        {
                          source: ValidSources;
                          count: number;
                          hasSuccessfulRun: boolean;
                        }
                      >
                    );

                    // Helper function to format source names
                    const formatSourceName = (source: string) => {
                      return source
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ");
                    };

                    return Object.values(groupedConnectors).map((group) => (
                      <div
                        key={group.source}
                        className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <SourceIcon sourceType={group.source} iconSize={24} />
                          <div>
                            <p className="font-medium">
                              {formatSourceName(group.source)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {group.count > 1
                                ? `${group.count} connectors`
                                : "Connected"}
                            </p>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground font-medium">
                          Active
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
              */}
              {/* Federated Search Section
              {federatedConnectors && federatedConnectors.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-md font-medium text-muted-foreground">
                    Federated Connectors
                  </h4>
                  {(() => {
                    // Helper function to format source names
                    const formatSourceName = (source: string) => {
                      return source
                        .split("_")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ");
                    };

                    return federatedConnectors.map((connector) => {
                      const sourceMetadata = getSourceMetadata(
                        connector.source as ValidSources
                      );
                      return (
                        <div
                          key={connector.federated_connector_id}
                          className="flex items-center justify-between p-4 rounded-lg border border-border"
                        >
                          <div className="flex items-center gap-3">
                            <SourceIcon
                              sourceType={sourceMetadata.internalName}
                              iconSize={24}
                            />
                            <div>
                              <p className="font-medium">
                                {formatSourceName(sourceMetadata.displayName)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {connector.has_oauth_token
                                  ? "Connected"
                                  : "Not connected"}
                              </p>
                            </div>
                          </div>
                          <div>
                            {connector.has_oauth_token ? (
                              <Button
                                secondary
                                onClick={() =>
                                  handleDisconnectOAuth(
                                    connector.federated_connector_id
                                  )
                                }
                                disabled={
                                  isDisconnecting ===
                                  connector.federated_connector_id
                                }
                              >
                                {isDisconnecting ===
                                connector.federated_connector_id
                                  ? "Disconnecting..."
                                  : "Disconnect"}
                              </Button>
                            ) : (
                              <Button
                                onClick={() => {
                                  if (connector.authorize_url) {
                                    handleConnectOAuth(connector.authorize_url);
                                  }
                                }}
                                disabled={!connector.authorize_url}
                                leftIcon={SvgExternalLink}
                              >
                                Connect
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
              {!hasConnectors && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Keine Konnektoren verfügbar.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        */}
      </div>
    </div>
  );
}
