# Token Refresh Flow Implementation Guide

## Server-Side ✅ (Already Implemented)

Your backend now has the complete refresh token flow:

### Endpoints:

1. **POST `/api/auth/login`**
   - Request: `{ username, password }`
   - Response: `{ accessToken, refreshToken, user }`

2. **POST `/api/auth/refresh`** ✨ NEW
   - Request: `{ refreshToken }`
   - Response: `{ accessToken, refreshToken }`
   - Returns 401 if refresh token is expired/invalid

3. **POST `/api/auth/logout`** ✨ NEW (Protected)
   - Clears the refresh token from database
   - User must be authenticated

### Token Configuration:
- **Access Token**: 1 hour expiration
- **Refresh Token**: 7 days expiration

---

## Flutter Client-Side Implementation 🎯

### 1. Install Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.2.0
  jwt_decoder: ^2.0.0
  flutter_secure_storage: ^9.0.0
  dio: ^5.0.0  # Alternative to http (recommended)
```

### 2. Token Storage Service

```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _storage = FlutterSecureStorage();
  
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';
  
  // Save tokens after login
  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }
  
  // Get access token
  static Future<String?> getAccessToken() async {
    return await _storage.read(key: _accessTokenKey);
  }
  
  // Get refresh token
  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: _refreshTokenKey);
  }
  
  // Clear tokens (logout)
  static Future<void> clear() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }
  
  // Check if tokens exist
  static Future<bool> hasTokens() async {
    final token = await _storage.read(key: _accessTokenKey);
    return token != null && token.isNotEmpty;
  }
}
```

### 3. API Service with Auto Token Refresh

```dart
import 'package:dio/dio.dart';
import 'package:jwt_decoder/jwt_decoder.dart';

class ApiService {
  static const String baseUrl = 'http://your-api.com/api';
  
  final Dio _dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
  ));
  
  ApiService() {
    _dio.interceptors.add(TokenInterceptor());
  }
  
  Future<Response> get(String path) async {
    return await _dio.get(path);
  }
  
  Future<Response> post(String path, dynamic data) async {
    return await _dio.post(path, data: data);
  }
  
  // ... other methods
}

// Interceptor to handle token refresh automatically
class TokenInterceptor extends Interceptor {
  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    final token = await TokenStorage.getAccessToken();
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    return handler.next(options);
  }
  
  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    // If 401, try to refresh token
    if (err.response?.statusCode == 401) {
      final refreshToken = await TokenStorage.getRefreshToken();
      
      if (refreshToken != null && await _isTokenExpired(refreshToken)) {
        // Refresh token is also expired - logout user
        await TokenStorage.clear();
        // Navigate to login
        _navigateToLogin();
        return handler.next(err);
      }
      
      try {
        // Try to get new access token
        final response = await Dio().post(
          '${ApiService.baseUrl}/auth/refresh',
          data: { 'refreshToken': refreshToken },
        );
        
        if (response.statusCode == 200) {
          final newAccessToken = response.data['accessToken'];
          final newRefreshToken = response.data['refreshToken'];
          
          // Save new tokens
          await TokenStorage.saveTokens(
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
          );
          
          // Retry original request with new token
          final options = err.requestOptions;
          options.headers['Authorization'] = 'Bearer $newAccessToken';
          final retryResponse = await Dio().request(
            options.path,
            options: options,
          );
          
          return handler.resolve(retryResponse);
        }
      } catch (e) {
        // Refresh failed - logout
        await TokenStorage.clear();
        _navigateToLogin();
      }
    }
    
    return handler.next(err);
  }
  
  Future<bool> _isTokenExpired(String token) async {
    try {
      return JwtDecoder.isExpired(token);
    } catch (e) {
      return true;
    }
  }
  
  void _navigateToLogin() {
    // Use your navigation to redirect to login
    // This depends on your navigation setup
  }
}
```

### 4. Auth Checker on App Start

```dart
class SplashPage extends StatefulWidget {
  const SplashPage({Key? key}) : super(key: key);

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    await Future.delayed(const Duration(seconds: 2)); // Splash delay

    if (!mounted) return;

    final hasTokens = await TokenStorage.hasTokens();

    if (!hasTokens) {
      _navigateToLogin();
      return;
    }

    final accessToken = await TokenStorage.getAccessToken();
    final refreshToken = await TokenStorage.getRefreshToken();

    // Check if access token is expired
    if (_isTokenExpired(accessToken!)) {
      // Try to refresh
      final isRefreshed = await _refreshToken(refreshToken!);
      
      if (isRefreshed) {
        _navigateToHome();
      } else {
        _navigateToLogin();
      }
    } else {
      // Access token is still valid
      _navigateToHome();
    }
  }

  bool _isTokenExpired(String token) {
    try {
      return JwtDecoder.isExpired(token);
    } catch (e) {
      return true;
    }
  }

  Future<bool> _refreshToken(String refreshToken) async {
    try {
      final response = await http.post(
        Uri.parse('http://your-api.com/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        await TokenStorage.saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
        );
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  void _navigateToHome() {
    Navigator.of(context).pushReplacementNamed('/home');
  }

  void _navigateToLogin() {
    Navigator.of(context).pushReplacementNamed('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
```

### 5. Login Implementation

```dart
class LoginPage extends StatefulWidget {
  const LoginPage({Key? key}) : super(key: key);

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('http://your-api.com/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'username': _usernameController.text,
          'password': _passwordController.text,
        }),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        
        // Save both tokens
        await TokenStorage.saveTokens(
          accessToken: data['accessToken'],
          refreshToken: data['refreshToken'],
        );

        if (mounted) {
          Navigator.of(context).pushReplacementNamed('/home');
        }
      } else {
        _showError('Login failed');
      }
    } catch (e) {
      _showError('Error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _usernameController,
              decoration: const InputDecoration(labelText: 'Username'),
            ),
            TextField(
              controller: _passwordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password'),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _isLoading ? null : _login,
              child: _isLoading
                  ? const CircularProgressIndicator()
                  : const Text('Login'),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 6. Logout Implementation

```dart
// In any authenticated page
Future<void> _logout() async {
  try {
    final token = await TokenStorage.getAccessToken();
    
    // Notify server to clear refresh token
    await http.post(
      Uri.parse('http://your-api.com/api/auth/logout'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );
  } catch (e) {
    print('Logout error: $e');
  }
  
  // Clear local tokens
  await TokenStorage.clear();
  
  if (mounted) {
    Navigator.of(context).pushReplacementNamed('/login');
  }
}
```

---

## Complete Flow Diagram

```
LOGIN
  ↓
  User sends: { username, password }
  ↓
  Server responds: { accessToken (1h), refreshToken (7d), user }
  ↓
  Save both tokens in secure storage
  ↓
  Redirect to Dashboard

MAKING API CALLS
  ↓
  Use accessToken in Authorization header
  ↓
  If 401 (token expired):
    - Try to refresh using refreshToken
    - Server validates and returns new accessToken
    - Retry the original request
    - If refresh fails → Logout user
  ↓
  Continue with new accessToken

APP RESTART
  ↓
  Check if tokens exist
  ↓
  If accessToken valid → Go to Dashboard
  ↓
  If accessToken expired:
    - Try refresh
    - If success → Go to Dashboard
    - If fail → Go to Login
  ↓
  If no tokens → Go to Login

LOGOUT
  ↓
  Call /auth/logout endpoint (clears refresh token on server)
  ↓
  Delete tokens from device storage
  ↓
  Redirect to Login
```

---

## Why This is Better 🎯

✅ **Security**: Short-lived access tokens reduce damage if compromised
✅ **User Experience**: No forced logout when token expires
✅ **Offline Support**: Can check token validity without server call
✅ **Scalability**: Backend can revoke tokens independently
✅ **Best Practice**: Industry standard for authentication

---

## Testing Endpoints

```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"user1","password":"pass123"}'

# Response:
# {
#   "accessToken": "eyJhbGc...",
#   "refreshToken": "eyJhbGc...",
#   "user": { "id": "...", "username": "user1", "role": "EMPLOYEE" }
# }

# 2. Refresh Token
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"eyJhbGc..."}'

# Response:
# { "accessToken": "eyJhbGc...", "refreshToken": "eyJhbGc..." }

# 3. Logout (needs access token)
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGc..."
```
