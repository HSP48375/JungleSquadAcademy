import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

interface EmailPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  template: {
    name: string;
    subject: string;
    html_content: string;
  };
  variables: Record<string, any>;
}

export default function EmailPreviewModal({
  visible,
  onClose,
  template,
  variables,
}: EmailPreviewModalProps) {
  // Replace variables in the template
  const getProcessedHtml = () => {
    let html = template.html_content;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value));
    }
    
    return html;
  };
  
  const processedHtml = getProcessedHtml();
  const processedSubject = template.subject.replace(/{{(\w+)}}/g, (_, key) => 
    variables[key] ? String(variables[key]) : `{{${key}}}`
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={styles.container}
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(200)}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Email Preview</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.subjectContainer}>
            <Text style={styles.subjectLabel}>Subject:</Text>
            <Text style={styles.subject}>{processedSubject}</Text>
          </View>
          
          <View style={styles.emailContainer}>
            {Platform.OS === 'web' ? (
              <div 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  overflow: 'auto',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 8,
                }}
                dangerouslySetInnerHTML={{ __html: processedHtml }}
              />
            ) : (
              <WebView
                source={{ html: processedHtml }}
                style={styles.webView}
              />
            )}
          </View>
          
          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
          >
            <Text style={styles.doneButtonText}>Close Preview</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  title: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  subjectLabel: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 14,
    color: '#AAAAAA',
    marginRight: 8,
  },
  subject: {
    fontFamily: 'SpaceGrotesk-Regular',
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  emailContainer: {
    height: 400,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: '#00FFA9',
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    fontFamily: 'SpaceGrotesk-Bold',
    fontSize: 16,
    color: '#000000',
  },
});