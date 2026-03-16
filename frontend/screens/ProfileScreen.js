import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Alert, Image, StatusBar, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../AuthContext';
import { updateProfile, getProfile, IMAGE_BASE_URL } from '../api';

const COLORS = {
  primary: '#FF6B35', bg: '#F5F5F5', white: '#FFFFFF',
  dark: '#1A1A2E', gray: '#888', green: '#2ECC71', red: '#E74C3C',
  lightGray: '#E8E8E8',
};

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (user?._id) {
      getProfile(user._id).then(data => {
        if (data && !data.message) {
          setName(data.name || '');
          setPhone(data.phone || '');
          setAddress(data.address || '');
          updateUser({ ...user, ...data });
        }
      }).catch(() => {});
    }
  }, []);

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
      setEditing(true);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('phone', phone);
      formData.append('address', address);
      if (avatar) {
        const uri = avatar.uri;
        const ext = uri.split('.').pop() || 'jpg';
        formData.append('avatar', { uri, name: `avatar_${Date.now()}.${ext}`, type: `image/${ext}` });
      }
      const result = await updateProfile(user._id, formData);
      if (result && !result.message) {
        updateUser({ ...user, ...result });
        Alert.alert('✅ Thành công', 'Đã cập nhật thông tin');
        setEditing(false);
        setAvatar(null);
      } else {
        Alert.alert('Lỗi', result.message || 'Không cập nhật được');
      }
    } catch {
      Alert.alert('Lỗi', 'Không cập nhật được');
    }
    setSaving(false);
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive', onPress: () => {
          logout();
          navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
        }
      },
    ]);
  };

  const avatarUri = avatar
    ? avatar.uri
    : user?.avatar
      ? IMAGE_BASE_URL + user.avatar
      : null;

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trang cá nhân</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={{ fontSize: 40 }}>👤</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Text style={{ fontSize: 14 }}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.displayName}>{user?.name || 'Người dùng'}</Text>
          <Text style={styles.usernameText}>@{user?.username || ''}</Text>
        </View>

        {/* Info Form */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Họ tên</Text>
            <TextInput
              style={styles.fieldInput}
              value={name}
              onChangeText={(v) => { setName(v); setEditing(true); }}
              placeholder="Nhập họ tên"
              placeholderTextColor="#BBB"
            />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Tên đăng nhập</Text>
            <View style={[styles.fieldInput, { backgroundColor: '#F0F0F0' }]}>
              <Text style={{ fontSize: 15, color: COLORS.gray }}>{user?.username || ''}</Text>
            </View>
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.fieldInput}
              value={phone}
              onChangeText={(v) => { setPhone(v); setEditing(true); }}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              placeholderTextColor="#BBB"
            />
          </View>

          <View style={styles.fieldWrapper}>
            <Text style={styles.fieldLabel}>Địa chỉ</Text>
            <TextInput
              style={styles.fieldInput}
              value={address}
              onChangeText={(v) => { setAddress(v); setEditing(true); }}
              placeholder="Nhập địa chỉ giao hàng"
              placeholderTextColor="#BBB"
            />
          </View>

          {editing && (
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.saveBtnText}>💾 Lưu thay đổi</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>🚪 Đăng xuất</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },

  avatarSection: { alignItems: 'center', marginTop: -30, marginBottom: 10 },
  avatar: {
    width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: COLORS.white,
    backgroundColor: '#E8E8E8',
  },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFF0E8',
    justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: COLORS.white,
  },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.white,
    justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
  },
  displayName: { fontSize: 20, fontWeight: 'bold', color: COLORS.dark, marginTop: 10 },
  usernameText: { fontSize: 14, color: COLORS.gray, marginTop: 2 },

  formSection: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16,
    borderRadius: 20, padding: 20, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.dark, marginBottom: 16 },

  fieldWrapper: { marginBottom: 14 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  fieldInput: {
    borderWidth: 1.5, borderColor: COLORS.lightGray, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: COLORS.dark,
    backgroundColor: '#FAFAFA',
  },

  saveBtn: {
    backgroundColor: COLORS.primary, height: 48, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginTop: 8,
  },
  saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },

  logoutBtn: {
    backgroundColor: COLORS.white, marginHorizontal: 16, marginTop: 16,
    borderRadius: 16, padding: 16, alignItems: 'center',
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4,
    borderWidth: 1, borderColor: COLORS.red + '30',
  },
  logoutText: { color: COLORS.red, fontSize: 16, fontWeight: 'bold' },
});
