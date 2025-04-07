import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function Register() {
  const { ref } = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(ref as string || null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const { signUp, loading, error } = useAuth();

  useEffect(() => {
    if (referralCode) {
      fetchReferrerInfo();
    }
  }, [referralCode]);

  const fetchReferrerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          avatar:user_avatar (
            avatar_name
          )
        `)
        .eq('referral_code', referralCode)
        .single();

      if (error) throw error;
      
      if (data?.avatar?.avatar_name) {
        setReferrerName(data.avatar.avatar_name);
      }
    } catch (e) {
      console.error('Error fetching referrer:', e);
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      setValidationError('Please enter your name');
      return false;
    }
    
    if (!email.trim()) {
      setValidationError('Please enter your email');
      return false;
    }
    
    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    
    setValidationError(null);
    return true;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;
    
    try {
      await signUp(email, password, name);
      
      // If there's a referral code, process it after signup
      if (referralCode) {
        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/redeem-referral`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ referralCode }),
          });
          
          if (!response.ok) {
            console.error('Failed to process referral');
          }
        } catch (e) {
          console.error('Error processing referral:', e);
        }
      }
      
      router.replace('/(app)');
    } catch (e) {
      // Error is handled in useAuth
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1A0B2E', '#0F172A']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.header}>
        <Text style={styles.title}>Join the Squad</Text>
        <Text style={styles.subtitle}>The World's Most Advanced AI Tutoring Ecosystem</Text>
        <Text style={styles.tagline}>Transform your potential today</Text>
        
        {referrerName && (
          <View style={styles.referralBanner}>
            <Text style={styles.referralText}>
              Invited by <Text style={styles.referrerName}>{referrerName}</Text>
            </Text>
            <Text style={styles.bonusText}>You'll both get 5 coins when you join!</Text>
          </View>
        )}
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          placeholderTextColor="#666"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          editable={!loading}
        />
        
        {!referralCode && (
          <TextInput
            style={styles.input}
            placeholder="Referral Code (Optional)"
            placeholderTextColor="#666"
            value={referralCode || ''}
            onChangeText={setReferralCode}
            editable={!loading}
          />
        )}
        
        {(validationError || error) && (
          <Text style={styles.errorText}>{validationError || error}</Text>
        )}
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.buttonText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <Link href="/login" asChild>
          <TouchableOpacity style={styles.linkButton} disabled={loading}>
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    padding: 20,
  },
  header: {
    marginTop: Platform.OS === 'web' ? 60 : 100,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-Bold',
    fontSize: 32,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#00FFA9',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 300,
  },
  tagline: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#B794F6',
    textAlign: 'center',
  },
  referralBanner: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 255, 169, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 169, 0.3)',
    width: '100%',
    maxWidth: 400,
  },
  referralText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  referrerName: {
    color: '#00FFA9',
    fontFamily: 'Poppins-Bold',
  },
  bonusText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#FFD700',
    textAlign: 'center',
    marginTop: 4,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  input: {
    backgroundColor: 'rgba(26, 26, 26, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    backgroundColor: '#00FFA9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  linkButton: {
    alignItems: 'center',
  },
  linkText: {
    color: '#00FFA9',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    marginBottom: 16,
    textAlign: 'center',
  },
});