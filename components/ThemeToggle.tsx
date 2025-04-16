import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../app/themeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: number;
  containerStyle?: object;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  showLabel = true, 
  size = 24, 
  containerStyle = {} 
}) => {
  const { theme, setTheme, isDarkMode } = useTheme();

  // Function to determine the icon based on current theme
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return 'sunny';
      case 'dark':
        return 'moon';
      case 'system':
        return isDarkMode ? 'moon' : 'sunny';
      default:
        return 'sunny';
    }
  };

  // Cycle through themes: light -> dark -> system -> light
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  // Get the theme label
  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'system':
        return 'System';
      default:
        return 'Light';
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        onPress={cycleTheme}
        style={[
          styles.button,
          isDarkMode ? styles.buttonDark : styles.buttonLight
        ]}
        accessibilityLabel={`Switch theme, current is ${getThemeLabel()}`}
      >
        <Ionicons 
          name={getThemeIcon()} 
          size={size} 
          color={isDarkMode ? '#F3F4F6' : '#1F2937'} 
        />
        {showLabel && (
          <Text style={[styles.label, isDarkMode ? styles.labelDark : styles.labelLight]}>
            {getThemeLabel()}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 6,
  },
  buttonLight: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  buttonDark: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  label: {
    fontWeight: '500',
    fontSize: 14,
  },
  labelLight: {
    color: '#1F2937',
  },
  labelDark: {
    color: '#F3F4F6',
  },
});

export default ThemeToggle; 