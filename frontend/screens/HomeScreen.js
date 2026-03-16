import React, { useState } from 'react';
import {
  View, Text, Alert, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, StatusBar, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { loginAccount, registerAccount } from '../api';
import { useAuth } from '../AuthContext';

const COLORS = {
  primary: '#FF6B35',
  bg: '#FFF8F4',
  white: '#FFFFFF',
  dark: '#1A1A2E',
  gray: '#888',
  lightGray: '#F0F0F0',
  inputBorder: '#E0E0E0',
};

export default function HomeScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const pickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Thông báo', 'Cần quyền truy cập thư viện ảnh'); return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length > 0) {
      setAvatar(result.assets[0]);
    }
  };

  const handleRegister = async () => {
    if (!name || !username || !password) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ họ tên, tên đăng nhập và mật khẩu');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('username', username);
      formData.append('password', password);
      if (avatar) {
        const uri = avatar.uri;
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('avatar', { uri, name: `avatar_${Date.now()}.${ext}`, type: `image/${ext}` });
      }
      const result = await registerAccount(formData);
      if (result.token) {
        login(result.user, result.token);
        Alert.alert('🎉 Đăng ký thành công!');
        if (result.user?.role === 'admin') {
          navigation.replace('Admin');
        } else {
          navigation.replace('CustomerTabs');
        }
      } else {
        Alert.alert('Lỗi', result.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên đăng nhập và mật khẩu');
      return;
    }
    setLoading(true);
    try {
      const result = await loginAccount({ username, password });
      if (result.token) {
        login(result.user, result.token);
        Alert.alert('🎉 Đăng nhập thành công!');
        if (result.user?.role === 'admin') {
          navigation.replace('Admin');
        } else {
          navigation.replace('CustomerTabs');
        }
      } else {
        Alert.alert('Lỗi', result.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      Alert.alert('Lỗi', err.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar backgroundColor={COLORS.bg} barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Brand */}
        <View style={styles.logoSection}>
          <Text style={styles.logoEmoji}>🍜</Text>
          <Text style={styles.brandName}>La cà Food</Text>
          <Text style={styles.tagline}>Đặt món ngon, giao tận nơi</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Đăng nhập</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Đăng ký</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          {!isLogin && (
            <>
              {/* Avatar picker */}
              <TouchableOpacity style={styles.avatarPicker} onPress={pickAvatar}>
                {avatar ? (
                  <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={{ fontSize: 32 }}>📷</Text>
                    <Text style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>Ảnh đại diện</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Họ tên</Text>
                <TextInput
                  placeholder="Nhập họ tên"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  placeholderTextColor="#BBB"
                />
              </View>
            </>
          )}

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Tên đăng nhập</Text>
            <TextInput
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor="#BBB"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Mật khẩu</Text>
            <TextInput
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholderTextColor="#BBB"
            />
          </View>

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Xác nhận mật khẩu</Text>
              <TextInput
                placeholder="Nhập lại mật khẩu"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={styles.input}
                placeholderTextColor="#BBB"
              />
            </View>
          )}

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={isLogin ? handleLogin : handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Đang xử lý...' : isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
            </Text>
          </TouchableOpacity>

          {/* Switch link */}
          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchLink}>
            <Text style={styles.switchText}>
              {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <Text style={styles.switchBold}>{isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoSection: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 64 },
  brandName: { fontSize: 32, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 },
  tagline: { fontSize: 14, color: COLORS.gray, marginTop: 4 },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  avatarPicker: { alignSelf: 'center', marginBottom: 16 },
  avatarImage: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: COLORS.primary },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#FFF0E8',
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#E8E8E8', borderStyle: 'dashed',
  },
  tabRow: { flexDirection: 'row', marginBottom: 24, backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: COLORS.white, elevation: 2 },
  tabText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },
  tabTextActive: { color: COLORS.primary },

  inputWrapper: { marginBottom: 16 },
  inputLabel: { fontSize: 13, color: COLORS.dark, fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.dark,
    backgroundColor: '#FAFAFA',
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: { color: COLORS.white, fontSize: 17, fontWeight: 'bold' },

  switchLink: { marginTop: 16, alignItems: 'center' },
  switchText: { fontSize: 14, color: COLORS.gray },
  switchBold: { color: COLORS.primary, fontWeight: '600' },
});
