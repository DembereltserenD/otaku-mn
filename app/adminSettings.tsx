import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, TextInput } from "react-native";
import { useTheme } from "@/context/ThemeProvider";
import Typography from "@/components/Typography";
import { supabase } from "@/lib/supabase";
import { Settings, Save, Database, Globe, Shield, Bell, Clock } from "lucide-react-native";

interface AppSetting {
  id: string;
  name: string;
  value: string;
  description: string;
  type: 'boolean' | 'string' | 'number';
}

type AppSettingInput = {
  id: string;
  name: string;
  value: string;
  description: string;
  type: string;
};

/**
 * AdminSettings component for managing application settings
 * Allows administrators to configure global app settings
 */
export default function AdminSettings() {
  const { colors } = useTheme();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modified, setModified] = useState(false);

  // Fetch settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch settings from database
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("app_settings")
        .select("*")
        .order("name");

      if (error) throw error;
      
      // If no settings exist yet, create default settings
      if (!data || data.length === 0) {
        const defaultSettings: AppSetting[] = [
          {
            id: "maintenance_mode",
            name: "Maintenance Mode",
            value: "false",
            description: "Enable maintenance mode to temporarily disable user access",
            type: "boolean" as const
          },
          {
            id: "allow_signups",
            name: "Allow New Signups",
            value: "true",
            description: "Allow new users to register",
            type: "boolean" as const
          },
          {
            id: "content_moderation",
            name: "Content Moderation",
            value: "true",
            description: "Require approval for user-submitted content",
            type: "boolean" as const
          },
          {
            id: "max_daily_uploads",
            name: "Max Daily Uploads",
            value: "5",
            description: "Maximum number of uploads per user per day",
            type: "number" as const
          },
          {
            id: "notification_frequency",
            name: "Notification Frequency",
            value: "daily",
            description: "How often to send digest notifications",
            type: "string" as const
          }
        ];
        
        await supabase.from("app_settings").insert(defaultSettings as AppSettingInput[]);
        setSettings(defaultSettings);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      Alert.alert("Error", "Failed to load settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update setting in state
  const updateSetting = (id: string, value: string) => {
    setSettings(settings.map(setting => 
      setting.id === id ? { ...setting, value } : setting
    ));
    setModified(true);
  };

  // Save settings to database
  const saveSettings = async () => {
    try {
      setSaving(true);
      
      // Update each setting
      for (const setting of settings) {
        const { error } = await supabase
          .from("app_settings")
          .update({ value: setting.value })
          .eq("id", setting.id);
          
        if (error) throw error;
      }
      
      Alert.alert("Success", "Settings saved successfully");
      setModified(false);
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Get icon for setting category
  const getSettingIcon = (id: string) => {
    if (id.includes('maintenance') || id.includes('system')) return Database;
    if (id.includes('content') || id.includes('upload')) return Globe;
    if (id.includes('security') || id.includes('allow')) return Shield;
    if (id.includes('notification')) return Bell;
    if (id.includes('frequency') || id.includes('max')) return Clock;
    return Settings;
  };

  // Render setting item
  const renderSetting = (setting: AppSetting) => {
    const SettingIcon = getSettingIcon(setting.id);
    
    return (
      <View key={setting.id} style={[styles.settingItem, { backgroundColor: colors.card }]}>
        <View style={styles.settingHeader}>
          <View style={styles.settingIcon}>
            <SettingIcon size={18} color={colors.primary} />
          </View>
          <View style={styles.settingInfo}>
            <Typography variant="body" style={{ fontWeight: '600', fontSize: 16 }}>
              {setting.name}
            </Typography>
            <Typography variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 2 }}>
              {setting.description}
            </Typography>
          </View>
        </View>
        
        <View style={styles.settingControl}>
          {setting.type === 'boolean' ? (
            <Switch
              value={setting.value === 'true'}
              onValueChange={(value) => updateSetting(setting.id, value.toString())}
              trackColor={{ false: colors.inactive, true: colors.primary }}
              thumbColor={colors.card}
            />
          ) : setting.type === 'number' ? (
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={setting.value}
              onChangeText={(text) => {
                // Ensure only numbers are entered
                if (/^\d*$/.test(text)) {
                  updateSetting(setting.id, text);
                }
              }}
              keyboardType="numeric"
              maxLength={5}
            />
          ) : (
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
              value={setting.value}
              onChangeText={(text) => updateSetting(setting.id, text)}
              maxLength={50}
            />
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Typography variant="h2">App Settings</Typography>
        {modified && (
          <TouchableOpacity 
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={saveSettings}
            disabled={saving}
          >
            <Save size={18} color={colors.card} />
            <Typography variant="bodySmall" style={{ color: colors.card, marginLeft: 4 }}>
              Save Changes
            </Typography>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Typography variant="h3" style={{ marginBottom: 16 }}>
            System Settings
          </Typography>
          {settings
            .filter(s => s.id.includes('maintenance') || s.id.includes('system'))
            .map(renderSetting)}
        </View>
        
        <View style={styles.section}>
          <Typography variant="h3" style={{ marginBottom: 16 }}>
            User & Security
          </Typography>
          {settings
            .filter(s => s.id.includes('allow') || s.id.includes('security'))
            .map(renderSetting)}
        </View>
        
        <View style={styles.section}>
          <Typography variant="h3" style={{ marginBottom: 16 }}>
            Content & Moderation
          </Typography>
          {settings
            .filter(s => s.id.includes('content') || s.id.includes('moderation') || s.id.includes('upload'))
            .map(renderSetting)}
        </View>
        
        <View style={styles.section}>
          <Typography variant="h3" style={{ marginBottom: 16 }}>
            Notifications
          </Typography>
          {settings
            .filter(s => s.id.includes('notification'))
            .map(renderSetting)}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  settingItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingControl: {
    marginTop: 8,
    alignItems: "flex-start",
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    width: '100%',
  },
});
