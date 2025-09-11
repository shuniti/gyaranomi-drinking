import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:html' as html; // Web用
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(GalaApp());
}

class GalaApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ギャラ飲みアプリ',
      theme: ThemeData(
        primarySwatch: Colors.pink,
      ),
      home: AuthWrapper(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class AuthWrapper extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: Colors.pink.shade600),
            ),
          );
        }
        
        if (snapshot.hasData) {
          return FutureBuilder<DocumentSnapshot>(
            future: FirebaseFirestore.instance
                .collection('users')
                .doc(snapshot.data!.uid)
                .get(),
            builder: (context, userSnapshot) {
              if (userSnapshot.connectionState == ConnectionState.waiting) {
                return Scaffold(
                  body: Center(
                    child: CircularProgressIndicator(color: Colors.pink.shade600),
                  ),
                );
              }
              
              if (userSnapshot.hasData && userSnapshot.data!.exists) {
                final userData = userSnapshot.data!.data() as Map<String, dynamic>;
                final userType = userData['type'] ?? 'customer';
                
                if (userType == 'girl') {
                  return GirlDashboard(userData: userData, uid: snapshot.data!.uid);
                } else {
                  return CustomerDashboard(userData: userData, uid: snapshot.data!.uid);
                }
              }
              
              return RegisterScreen(firebaseUser: snapshot.data);
            },
          );
        }
        
        return LoginScreen();
      },
    );
  }
}

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _auth = FirebaseAuth.instance;
  bool _isLoading = false;

  Future<void> _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showSnackBar('メールアドレスとパスワードを入力してください', Colors.red);
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      await _auth.signInWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text.trim(),
      );
      
      _showSnackBar('ログインしました！', Colors.green);
      
    } on FirebaseAuthException catch (e) {
      String message = '';
      switch (e.code) {
        case 'user-not-found':
          message = 'このメールアドレスは登録されていません';
          break;
        case 'wrong-password':
          message = 'パスワードが間違っています';
          break;
        case 'invalid-email':
          message = 'メールアドレスの形式が正しくありません';
          break;
        default:
          message = 'ログインに失敗しました: ${e.message}';
      }
      _showSnackBar(message, Colors.red);
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Colors.pink.shade300,
              Colors.pink.shade500,
              Colors.purple.shade400,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(32),
              child: Card(
                elevation: 20,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '🍷',
                        style: TextStyle(fontSize: 48),
                      ),
                      SizedBox(height: 24),
                      Text(
                        'ギャラ飲み',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.pink.shade600,
                        ),
                      ),
                      SizedBox(height: 40),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: 'メールアドレス',
                          prefixIcon: Icon(Icons.email_outlined),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                      ),
                      SizedBox(height: 20),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'パスワード',
                          prefixIcon: Icon(Icons.lock_outline),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(15),
                          ),
                        ),
                      ),
                      SizedBox(height: 32),
                      Container(
                        width: double.infinity,
                        height: 56,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleLogin,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.pink.shade600,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(15),
                            ),
                          ),
                          child: _isLoading
                              ? CircularProgressIndicator(color: Colors.white)
                              : Text(
                                  'ログイン',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                      SizedBox(height: 20),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => RegisterScreen(),
                            ),
                          );
                        },
                        child: Text('新規登録はこちら'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}

class RegisterScreen extends StatefulWidget {
  final User? firebaseUser;
  
  RegisterScreen({this.firebaseUser});

  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  String _userType = 'customer';
  final _nicknameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _ageController = TextEditingController();
  final _hourlyRateController = TextEditingController();
  final _introductionController = TextEditingController();
  final _locationController = TextEditingController();
  final _auth = FirebaseAuth.instance;
  final _firestore = FirebaseFirestore.instance;
  bool _isLoading = false;
  List<String> _selectedTags = [];
  String? _selectedImageBase64;

  final List<String> _availableTags = [
    '明るい', '聞き上手', '話し好き', '大人しい', 'お酒好き',
    '笑顔が素敵', '優しい', '元気', 'おしゃべり', '癒し系',
  ];

  void _selectImage() async {
    try {
      final html.FileUploadInputElement uploadInput = html.FileUploadInputElement();
      uploadInput.accept = 'image/*';
      uploadInput.click();

      uploadInput.onChange.listen((event) {
        final files = uploadInput.files;
        if (files!.length == 1) {
          final file = files[0];
          
          if (file.size > 5 * 1024 * 1024) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('画像サイズは5MB以下にしてください'),
                backgroundColor: Colors.red,
              ),
            );
            return;
          }
          
          final reader = html.FileReader();
          
          reader.onLoadEnd.listen((event) {
            setState(() {
              _selectedImageBase64 = reader.result as String?;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('プロフィール画像を選択しました'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 2),
              ),
            );
          });
          
          reader.onError.listen((event) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('画像の読み込みに失敗しました'),
                backgroundColor: Colors.red,
              ),
            );
          });
          
          reader.readAsDataUrl(file);
        }
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('画像選択に失敗しました: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _createAccount() async {
    if (_nicknameController.text.isEmpty) {
      _showSnackBar('ニックネームを入力してください', Colors.red);
      return;
    }

    if (widget.firebaseUser == null && 
        (_emailController.text.isEmpty || _passwordController.text.isEmpty)) {
      _showSnackBar('メールアドレスとパスワードを入力してください', Colors.red);
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      User? firebaseUser = widget.firebaseUser;
      
      if (firebaseUser == null) {
        UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
          email: _emailController.text.trim(),
          password: _passwordController.text.trim(),
        );
        firebaseUser = userCredential.user!;
      }

      Map<String, dynamic> userData = {
        'type': _userType,
        'nickname': _nicknameController.text,
        'email': firebaseUser.email ?? _emailController.text,
        'age': int.tryParse(_ageController.text) ?? 25,
        'location': _locationController.text.isEmpty ? '東京都' : _locationController.text,
        'isOnline': true,
        'createdAt': FieldValue.serverTimestamp(),
        'lastSeen': FieldValue.serverTimestamp(),
      };

      if (_userType == 'girl') {
        userData.addAll({
          'hourlyRate': _hourlyRateController.text.isEmpty ? '8000' : _hourlyRateController.text,
          'introduction': _introductionController.text.isEmpty ? 'よろしくお願いします♪' : _introductionController.text,
          'tags': _selectedTags.isEmpty ? ['明るい', '聞き上手'] : _selectedTags,
          'rating': 5.0,
          'reviewCount': 0,
          'profileImage': _selectedImageBase64,
        });
      }

      await _firestore.collection('users').doc(firebaseUser.uid).set(userData);

      _showSnackBar('アカウントが作成されました！', Colors.green);

    } on FirebaseAuthException catch (e) {
      String message = '';
      switch (e.code) {
        case 'weak-password':
          message = 'パスワードが弱すぎます';
          break;
        case 'email-already-in-use':
          message = 'このメールアドレスは既に使用されています';
          break;
        default:
          message = 'アカウント作成に失敗しました';
      }
      _showSnackBar(message, Colors.red);
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _showSnackBar(String message, Color color) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: color,
      ),
    );
  }

  Widget _buildUserTypeCard(String type, String icon, String title, MaterialColor color) {
    bool isSelected = _userType == type;
    return GestureDetector(
      onTap: () => setState(() => _userType = type),
      child: Container(
        padding: EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? color.shade100 : Colors.white,
          border: Border.all(
            color: isSelected ? color.shade500 : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Text(icon, style: TextStyle(fontSize: 40)),
            SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: isSelected ? color.shade700 : Colors.grey.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileImageSelector() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.pink.shade300, width: 2),
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [Colors.pink.shade50, Colors.purple.shade50],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: EdgeInsets.all(20),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.photo_camera, color: Colors.pink.shade600, size: 24),
              SizedBox(width: 8),
              Text(
                'プロフィール写真',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.pink.shade700,
                ),
              ),
            ],
          ),
          SizedBox(height: 16),
          GestureDetector(
            onTap: _selectImage,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.pink.shade300, width: 3),
                boxShadow: [
                  BoxShadow(
                    color: Colors.pink.shade200.withOpacity(0.5),
                    blurRadius: 10,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: ClipOval(
                child: _selectedImageBase64 != null
                    ? Image.network(
                        _selectedImageBase64!,
                        fit: BoxFit.cover,
                        width: 140,
                        height: 140,
                      )
                    : Container(
                        color: Colors.pink.shade50,
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.add_a_photo_outlined,
                              size: 40,
                              color: Colors.pink.shade400,
                            ),
                            SizedBox(height: 8),
                            Text(
                              '写真を選択',
                              style: TextStyle(
                                color: Colors.pink.shade600,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
              ),
            ),
          ),
          SizedBox(height: 16),
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.pink.shade100,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Text(
                  '顔がはっきり見える写真がおすすめです',
                  style: TextStyle(
                    color: Colors.pink.shade700,
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 4),
                Text(
                  '※ ファイルサイズは5MB以下でお願いします',
                  style: TextStyle(
                    color: Colors.pink.shade600,
                    fontSize: 11,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('新規登録'),
        backgroundColor: Colors.pink.shade600,
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            Text(
              '登録タイプを選択',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _buildUserTypeCard('customer', '👨‍💼', 'お客様', Colors.blue),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: _buildUserTypeCard('girl', '👩‍💼', 'キャスト', Colors.pink),
                ),
              ],
            ),
            SizedBox(height: 24),
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  children: [
                    TextField(
                      controller: _nicknameController,
                      decoration: InputDecoration(
                        labelText: 'ニックネーム',
                        prefixIcon: Icon(Icons.person_outline),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    if (widget.firebaseUser == null) ...[
                      SizedBox(height: 16),
                      TextField(
                        controller: _emailController,
                        keyboardType: TextInputType.emailAddress,
                        decoration: InputDecoration(
                          labelText: 'メールアドレス',
                          prefixIcon: Icon(Icons.email_outlined),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      SizedBox(height: 16),
                      TextField(
                        controller: _passwordController,
                        obscureText: true,
                        decoration: InputDecoration(
                          labelText: 'パスワード',
                          prefixIcon: Icon(Icons.lock_outline),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ],
                    SizedBox(height: 16),
                    TextField(
                      controller: _ageController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: '年齢',
                        prefixIcon: Icon(Icons.cake_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _locationController,
                      decoration: InputDecoration(
                        labelText: '地域',
                        hintText: '東京都',
                        prefixIcon: Icon(Icons.location_on_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    if (_userType == 'girl') ...[
                      SizedBox(height: 24),
                      _buildProfileImageSelector(),
                      SizedBox(height: 20),
                      TextField(
                        controller: _hourlyRateController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: '時給',
                          hintText: '8000',
                          suffixText: '円/時間',
                          prefixIcon: Icon(Icons.monetization_on_outlined),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      SizedBox(height: 16),
                      TextField(
                        controller: _introductionController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          labelText: '自己紹介',
                          hintText: '簡単な自己紹介をお書きください',
                          prefixIcon: Icon(Icons.edit_outlined),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                      SizedBox(height: 20),
                      Text(
                        'タグ選択（複数選択可）',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      SizedBox(height: 12),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _availableTags.map((tag) {
                          final isSelected = _selectedTags.contains(tag);
                          return GestureDetector(
                            onTap: () {
                              setState(() {
                                if (isSelected) {
                                  _selectedTags.remove(tag);
                                } else {
                                  _selectedTags.add(tag);
                                }
                              });
                            },
                            child: AnimatedContainer(
                              duration: Duration(milliseconds: 200),
                              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSelected ? Colors.pink.shade500 : Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(25),
                                border: Border.all(
                                  color: isSelected ? Colors.pink.shade500 : Colors.grey.shade300,
                                ),
                                boxShadow: isSelected ? [
                                  BoxShadow(
                                    color: Colors.pink.shade200,
                                    blurRadius: 4,
                                    offset: Offset(0, 2),
                                  ),
                                ] : null,
                              ),
                              child: Text(
                                tag,
                                style: TextStyle(
                                  color: isSelected ? Colors.white : Colors.grey.shade700,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            SizedBox(height: 32),
            Container(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _createAccount,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.pink.shade600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  elevation: 5,
                ),
                child: _isLoading
                    ? CircularProgressIndicator(color: Colors.white)
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(_userType == 'girl' ? Icons.person_add : Icons.account_circle, size: 20),
                          SizedBox(width: 8),
                          Text(
                            _userType == 'girl' ? 'キャスト登録' : 'アカウント作成',
                            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _ageController.dispose();
    _hourlyRateController.dispose();
    _introductionController.dispose();
    _locationController.dispose();
    super.dispose();
  }
}

class CustomerDashboard extends StatefulWidget {
  final Map<String, dynamic> userData;
  final String uid;

  CustomerDashboard({required this.userData, required this.uid});

  @override
  _CustomerDashboardState createState() => _CustomerDashboardState();
}

class _CustomerDashboardState extends State<CustomerDashboard> {
  int _selectedIndex = 0;
  String? _selectedLocation;
  bool _showOfflineUsers = false;
  final List<String> _locations = [
    '全ての地域',
    '東京都',
    '神奈川県',
    '千葉県',
    '埼玉県',
    '大阪府',
    '京都府',
    '兵庫県',
    '愛知県',
    '福岡県',
    '北海道',
    'その他'
  ];

  @override
  void initState() {
    super.initState();
    _selectedLocation = '全ての地域';
  }

  Stream<QuerySnapshot> _getFilteredStream() {
    Query query = FirebaseFirestore.instance
        .collection('users')
        .where('type', isEqualTo: 'girl');
    
    if (!_showOfflineUsers) {
      query = query.where('isOnline', isEqualTo: true);
    }
    
    if (_selectedLocation != null && _selectedLocation != '全ての地域') {
      query = query.where('location', isEqualTo: _selectedLocation);
    }
    
    return query.snapshots();
  }

  Widget _buildGirlsListTab() {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(Icons.location_on, color: Colors.blue.shade600),
              SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _selectedLocation,
                  decoration: InputDecoration(
                    labelText: '地域で絞り込み',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  items: _locations.map((location) {
                    return DropdownMenuItem(
                      value: location,
                      child: Text(location),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedLocation = value;
                    });
                  },
                ),
              ),
              SizedBox(width: 12),
              Container(
                decoration: BoxDecoration(
                  color: Colors.blue.shade600,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: IconButton(
                  onPressed: () {
                    setState(() {});
                  },
                  icon: Icon(Icons.search, color: Colors.white),
                  tooltip: '検索',
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: _getFilteredStream(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return Center(
                  child: CircularProgressIndicator(color: Colors.blue.shade600),
                );
              }

              if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text('😢', style: TextStyle(fontSize: 64)),
                      SizedBox(height: 16),
                      Text(
                        _selectedLocation == '全ての地域' 
                            ? (_showOfflineUsers ? '条件に合う女の子はいません' : '現在オンラインの女の子はいません')
                            : '${_selectedLocation}に${_showOfflineUsers ? '' : 'オンラインの'}女の子はいません',
                        style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          ElevatedButton(
                            onPressed: () {
                              setState(() {
                                _selectedLocation = '全ての地域';
                              });
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue.shade600,
                              foregroundColor: Colors.white,
                            ),
                            child: Text('全ての地域で検索'),
                          ),
                          if (!_showOfflineUsers) ...[
                            SizedBox(width: 12),
                            ElevatedButton(
                              onPressed: () {
                                setState(() {
                                  _showOfflineUsers = true;
                                });
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.grey.shade600,
                                foregroundColor: Colors.white,
                              ),
                              child: Text('オフラインも表示'),
                            ),
                          ],
                        ],
                      ),
                    ],
                  ),
                );
              }

              final girls = snapshot.data!.docs;

              return ListView.builder(
                padding: EdgeInsets.all(16),
                itemCount: girls.length,
                itemBuilder: (context, index) {
                  final girlData = girls[index].data() as Map<String, dynamic>;
                  return _buildGirlCard(context, girlData, girls[index].id);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildBookingsTab() {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('bookings')
          .where('customerUid', isEqualTo: widget.uid)
          .orderBy('startTime', descending: false)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(
            child: CircularProgressIndicator(color: Colors.blue.shade600),
          );
        }

        if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('📅', style: TextStyle(fontSize: 64)),
                SizedBox(height: 16),
                Text(
                  '予約はありません',
                  style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                ),
                SizedBox(height: 8),
                Text(
                  'お気に入りのキャストを見つけて予約してみましょう',
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        final bookings = snapshot.data!.docs;

        return ListView.builder(
          padding: EdgeInsets.all(16),
          itemCount: bookings.length,
          itemBuilder: (context, index) {
            final bookingData = bookings[index].data() as Map<String, dynamic>;
            return _buildBookingCard(context, bookingData, bookings[index].id);
          },
        );
      },
    );
  }

  Widget _buildBookingCard(BuildContext context, Map<String, dynamic> bookingData, String bookingId) {
    final startTime = (bookingData['startTime'] as Timestamp).toDate();
    final endTime = (bookingData['endTime'] as Timestamp).toDate();
    final status = bookingData['status'] ?? 'pending';
    
    Color statusColor;
    String statusText;
    IconData statusIcon;
    
    switch (status) {
      case 'confirmed':
        statusColor = Colors.green;
        statusText = '予約確定';
        statusIcon = Icons.check_circle;
        break;
      case 'rejected':
        statusColor = Colors.red;
        statusText = '予約キャンセル';
        statusIcon = Icons.cancel;
        break;
      case 'completed':
        statusColor = Colors.blue;
        statusText = '完了';
        statusIcon = Icons.done_all;
        break;
      default:
        statusColor = Colors.orange;
        statusText = '承認待ち';
        statusIcon = Icons.hourglass_empty;
    }

    return Card(
      margin: EdgeInsets.only(bottom: 16),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  bookingData['girlName'] ?? '',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(statusIcon, size: 16, color: statusColor),
                      SizedBox(width: 4),
                      Text(
                        statusText,
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.schedule, size: 16, color: Colors.grey.shade600),
                SizedBox(width: 8),
                Text(
                  '${startTime.month}/${startTime.day} ${startTime.hour}:${startTime.minute.toString().padLeft(2, '0')} - ${endTime.hour}:${endTime.minute.toString().padLeft(2, '0')}',
                  style: TextStyle(color: Colors.grey.shade700),
                ),
              ],
            ),
            SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                SizedBox(width: 8),
                Text(
                  bookingData['location'] ?? '',
                  style: TextStyle(color: Colors.grey.shade700),
                ),
              ],
            ),
            if (bookingData['message']?.isNotEmpty == true) ...[
              SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.message, size: 16, color: Colors.grey.shade600),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      bookingData['message'],
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                  ),
                ],
              ),
            ],
            if (status == 'pending') ...[
              SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => _cancelBooking(bookingId),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.red.shade600,
                        side: BorderSide(color: Colors.red.shade600),
                      ),
                      child: Text('キャンセル'),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _cancelBooking(String bookingId) async {
    try {
      await FirebaseFirestore.instance
          .collection('bookings')
          .doc(bookingId)
          .update({'status': 'cancelled'});

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('予約をキャンセルしました'),
          backgroundColor: Colors.orange,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('キャンセルに失敗しました'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedIndex == 0 ? 'キャスト一覧' : '予約状況'),
        backgroundColor: Colors.blue.shade600,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () => _logout(context),
          ),
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: Center(
              child: Text('${widget.userData['nickname']}さん'),
            ),
          ),
        ],
        automaticallyImplyLeading: false,
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _buildGirlsListTab(),
          _buildBookingsTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.people),
            label: 'キャスト一覧',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.calendar_today),
            label: '予約状況',
          ),
        ],
      ),
    );
  }

  Widget _buildGirlCard(BuildContext context, Map<String, dynamic> girlData, String girlId) {
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: [Colors.white, Colors.pink.shade50.withOpacity(0.3)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Column(
            children: [
              Row(
                children: [
                  _buildProfileImageDisplay(
                    girlData['profileImage'],
                    size: 80,
                    isOnline: girlData['isOnline'] == true,
                  ),
                  SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                '${girlData['nickname']} (${girlData['age']}歳)',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.grey.shade800,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (girlData['hourlyRate'] != null)
                              Container(
                                padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [Colors.pink.shade500, Colors.purple.shade400],
                                  ),
                                  borderRadius: BorderRadius.circular(15),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.pink.shade300.withOpacity(0.5),
                                      blurRadius: 4,
                                      offset: Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Text(
                                  '${girlData['hourlyRate']}円/時',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        SizedBox(height: 6),
                        if (girlData['location'] != null)
                          Row(
                            children: [
                              Icon(Icons.location_on, size: 16, color: Colors.blue.shade600),
                              SizedBox(width: 4),
                              Text(
                                girlData['location'],
                                style: TextStyle(
                                  color: Colors.blue.shade600,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              SizedBox(width: 12),
                              Container(
                                padding: EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: (girlData['isOnline'] == true) ? Colors.green.shade50 : Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(
                                    color: (girlData['isOnline'] == true) ? Colors.green.shade200 : Colors.grey.shade300,
                                  ),
                                ),
                                child: Text(
                                  (girlData['isOnline'] == true) ? 'オンライン' : 'オフライン',
                                  style: TextStyle(
                                    color: (girlData['isOnline'] == true) ? Colors.green.shade700 : Colors.grey.shade600,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        SizedBox(height: 10),
                        Text(
                          girlData['introduction'] ?? 'よろしくお願いします♪',
                          style: TextStyle(
                            color: Colors.grey.shade700,
                            fontSize: 14,
                            height: 1.3,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              if (girlData['tags'] != null && (girlData['tags'] as List).isNotEmpty) ...[
                SizedBox(height: 16),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Wrap(
                    spacing: 6,
                    runSpacing: 6,
                    children: (girlData['tags'] as List<dynamic>).take(4).map((tag) {
                      return Container(
                        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.pink.shade50,
                          borderRadius: BorderRadius.circular(15),
                          border: Border.all(color: Colors.pink.shade200),
                        ),
                        child: Text(
                          tag.toString(),
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.pink.shade700,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
              SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => MessageScreen(
                              customerData: widget.userData,
                              customerUid: widget.uid,
                              girlData: girlData,
                              girlUid: girlId,
                            ),
                          ),
                        );
                      },
                      icon: Icon(Icons.message_outlined, size: 18),
                      label: Text('メッセージ'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green.shade600,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: EdgeInsets.symmetric(vertical: 12),
                        elevation: 3,
                      ),
                    ),
                  ),
                  SizedBox(width: 8),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CalendarScreen(
                              girlData: girlData,
                              girlUid: girlId,
                              customerData: widget.userData,
                              customerUid: widget.uid,
                            ),
                          ),
                        );
                      },
                      icon: Icon(Icons.calendar_today, size: 18),
                      label: Text('予約'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.purple.shade600,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: EdgeInsets.symmetric(vertical: 12),
                        elevation: 3,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _logout(BuildContext context) async {
    try {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(widget.uid)
          .update({
        'lastSeen': FieldValue.serverTimestamp(),
      });

      await FirebaseAuth.instance.signOut();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('ログアウトに失敗しました')),
      );
    }
  }
}

// プロフィール画像表示用のヘルパーウィジェット
Widget _buildProfileImageDisplay(String? imageUrl, {double size = 80, bool isOnline = false}) {
  return Stack(
    children: [
      Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(
            color: isOnline ? Colors.green : Colors.grey.shade400,
            width: 3,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.pink.shade200.withOpacity(0.5),
              blurRadius: 8,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: ClipOval(
          child: imageUrl != null && imageUrl.isNotEmpty
              ? Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  width: size,
                  height: size,
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      color: Colors.pink.shade50,
                      child: Center(
                        child: CircularProgressIndicator(
                          color: Colors.pink.shade400,
                          strokeWidth: 2,
                        ),
                      ),
                    );
                  },
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.pink.shade100,
                      child: Icon(
                        Icons.person,
                        size: size * 0.5,
                        color: Colors.pink.shade400,
                      ),
                    );
                  },
                )
              : Container(
                  color: Colors.pink.shade100,
                  child: Icon(
                    Icons.person,
                    size: size * 0.5,
                    color: Colors.pink.shade400,
                  ),
                ),
        ),
      ),
      Positioned(
        bottom: 0,
        right: 0,
        child: Container(
          width: size * 0.3,
          height: size * 0.3,
          decoration: BoxDecoration(
            color: isOnline ? Colors.green : Colors.grey.shade400,
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
          ),
        ),
      ),
    ],
  );
}

class GirlDashboard extends StatelessWidget {
  final Map<String, dynamic> userData;
  final String uid;

  GirlDashboard({required this.userData, required this.uid});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<DocumentSnapshot>(
      stream: FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .snapshots(),
      builder: (context, snapshot) {
        Map<String, dynamic> currentUserData = userData;
        
        if (snapshot.hasData && snapshot.data!.exists) {
          currentUserData = snapshot.data!.data() as Map<String, dynamic>;
        }

        return Scaffold(
          appBar: AppBar(
            title: Text('キャストダッシュボード'),
            backgroundColor: Colors.pink.shade600,
            foregroundColor: Colors.white,
            actions: [
              IconButton(
                icon: Icon(Icons.logout),
                onPressed: () => _logout(context),
              ),
              Padding(
                padding: EdgeInsets.only(right: 16),
                child: Center(
                  child: Text('${currentUserData['nickname']}さん'),
                ),
              ),
            ],
            automaticallyImplyLeading: false,
          ),
          body: DefaultTabController(
            length: kDebugMode ? 5 : 4, // デバッグモードでは5つ、本番では4つ
            child: Column(
              children: [
                TabBar(
                  tabs: [
                    Tab(icon: Icon(Icons.dashboard), text: 'ダッシュボード'),
                    Tab(icon: Icon(Icons.message), text: 'メッセージ'),
                    Tab(icon: Icon(Icons.calendar_today), text: 'スケジュール'),
                    Tab(icon: Icon(Icons.list_alt), text: '予約管理'),
                    if (kDebugMode) Tab(icon: Icon(Icons.bug_report), text: 'デバッグ'),
                  ],
                ),
                Expanded(
                  child: TabBarView(
                    children: [
                      _buildDashboardTab(context, currentUserData),
                      _buildMessagesTab(context, currentUserData),
                      ScheduleManagementScreen(userData: currentUserData, uid: uid),
                      BookingManagementScreen(userData: currentUserData, uid: uid),
                      if (kDebugMode) DebugBookingScreen(uid: uid),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildMessagesTab(BuildContext context, Map<String, dynamic> currentUserData) {
    return StreamBuilder<QuerySnapshot>(
      stream: FirebaseFirestore.instance
          .collection('chats')
          .where('participants', arrayContains: uid)
          .snapshots(),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 64, color: Colors.red),
                SizedBox(height: 16),
                Text(
                  'メッセージの読み込みに失敗しました',
                  style: TextStyle(fontSize: 16, color: Colors.grey.shade600),
                ),
              ],
            ),
          );
        }

        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(
            child: CircularProgressIndicator(color: Colors.pink.shade600),
          );
        }

        if (!snapshot.hasData) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.pink.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.message_outlined,
                    size: 40,
                    color: Colors.pink.shade400,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  'メッセージはありません',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          );
        }

        final allChats = snapshot.data!.docs;
        final sortedChats = allChats.where((doc) {
          final data = doc.data() as Map<String, dynamic>;
          final participants = List<String>.from(data['participants'] ?? []);
          return participants.contains(uid);
        }).toList();
        
        sortedChats.sort((a, b) {
          final aData = a.data() as Map<String, dynamic>;
          final bData = b.data() as Map<String, dynamic>;
          
          final aTime = aData['lastMessageTime'] as Timestamp? ?? aData['createdAt'] as Timestamp?;
          final bTime = bData['lastMessageTime'] as Timestamp? ?? bData['createdAt'] as Timestamp?;
          
          if (aTime == null && bTime == null) return 0;
          if (aTime == null) return 1;
          if (bTime == null) return -1;
          
          return bTime.compareTo(aTime);
        });

        if (sortedChats.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.pink.shade100,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    Icons.message_outlined,
                    size: 40,
                    color: Colors.pink.shade400,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  'メッセージはありません',
                  style: TextStyle(
                    fontSize: 18,
                    color: Colors.grey.shade600,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'お客様からメッセージが届くとここに表示されます',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey.shade500,
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: EdgeInsets.all(16),
          itemCount: sortedChats.length,
          itemBuilder: (context, index) {
            final chatData = sortedChats[index].data() as Map<String, dynamic>;
            return _buildChatListItem(context, chatData, sortedChats[index].id, currentUserData);
          },
        );
      },
    );
  }

  Widget _buildChatListItem(BuildContext context, Map<String, dynamic> chatData, String chatId, Map<String, dynamic> currentUserData) {
    final participants = List<String>.from(chatData['participants'] ?? []);
    final otherUserId = participants.firstWhere((id) => id != uid, orElse: () => '');
    
    if (otherUserId.isEmpty) return Container();

    return FutureBuilder<DocumentSnapshot>(
      future: FirebaseFirestore.instance.collection('users').doc(otherUserId).get(),
      builder: (context, userSnapshot) {
        if (!userSnapshot.hasData || !userSnapshot.data!.exists) {
          return Container();
        }

        final otherUserData = userSnapshot.data!.data() as Map<String, dynamic>;
        final lastMessage = chatData['lastMessage'] ?? '';
        final lastMessageTime = chatData['lastMessageTime'] as Timestamp?;
        final lastMessageSender = chatData['lastMessageSender'] ?? '';
        final isFromMe = lastMessageSender == uid;

        return Card(
          margin: EdgeInsets.only(bottom: 12),
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: ListTile(
            contentPadding: EdgeInsets.all(16),
            leading: Stack(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: (otherUserData['isOnline'] == true) ? Colors.green : Colors.grey.shade400,
                      width: 2,
                    ),
                  ),
                  child: ClipOval(
                    child: Container(
                      color: Colors.blue.shade100,
                      child: Icon(
                        Icons.person,
                        size: 25,
                        color: Colors.blue.shade400,
                      ),
                    ),
                  ),
                ),
                if (otherUserData['isOnline'] == true)
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            title: Text(
              otherUserData['nickname'] ?? 'ユーザー',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 4),
                Text(
                  '${isFromMe ? 'あなた: ' : ''}$lastMessage',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 14,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                SizedBox(height: 4),
                Text(
                  lastMessageTime != null ? _formatChatTime(lastMessageTime.toDate()) : '',
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            trailing: Icon(
              Icons.chevron_right,
              color: Colors.grey.shade400,
            ),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => MessageScreen(
                    customerData: otherUserData,
                    customerUid: otherUserId,
                    girlData: currentUserData,
                    girlUid: uid,
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  String _formatChatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      if (difference.inDays == 1) {
        return '昨日';
      } else if (difference.inDays < 7) {
        return '${difference.inDays}日前';
      } else {
        return '${dateTime.month}/${dateTime.day}';
      }
    } else if (difference.inHours > 0) {
      return '${difference.inHours}時間前';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}分前';
    } else {
      return 'たった今';
    }
  }

  Widget _buildDashboardTab(BuildContext context, Map<String, dynamic> currentUserData) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.green.shade50, Colors.green.shade100],
              ),
              border: Border.all(color: Colors.green.shade200),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.green.shade100.withOpacity(0.5),
                  blurRadius: 8,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Text(
                  'キャスト登録完了！',
                  style: TextStyle(
                    color: Colors.green.shade700,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'お客様からの連絡をお待ちください♪',
                  style: TextStyle(
                    color: Colors.green.shade700,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
          SizedBox(height: 16),
          _buildProfileCard(context, currentUserData),
        ],
      ),
    );
  }

  Widget _buildProfileCard(BuildContext context, Map<String, dynamic> currentUserData) {
    return Card(
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: [Colors.white, Colors.pink.shade50.withOpacity(0.3)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  _buildProfileImageDisplay(
                    currentUserData['profileImage'],
                    size: 80,
                    isOnline: currentUserData['isOnline'] == true,
                  ),
                  SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'プロフィール',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.grey.shade800,
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'お客様に表示される情報',
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                        ),
                        SizedBox(height: 8),
                        AnimatedContainer(
                          duration: Duration(milliseconds: 300),
                          padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: (currentUserData['isOnline'] == true) ? Colors.green.shade50 : Colors.grey.shade100,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: (currentUserData['isOnline'] == true) ? Colors.green.shade200 : Colors.grey.shade300,
                            ),
                          ),
                          child: Text(
                            (currentUserData['isOnline'] == true) ? '🟢 オンライン' : '⚫ オフライン',
                            style: TextStyle(
                              color: (currentUserData['isOnline'] == true) ? Colors.green.shade700 : Colors.grey.shade600,
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              SizedBox(height: 20),
              _buildProfileRow('ニックネーム', currentUserData['nickname'] ?? ''),
              _buildProfileRow('年齢', '${currentUserData['age']}歳'),
              if (currentUserData['hourlyRate'] != null)
                _buildProfileRow('時給', '${currentUserData['hourlyRate']}円/時間'),
              if (currentUserData['location'] != null)
                _buildProfileRow('地域', currentUserData['location']),
              if (currentUserData['introduction'] != null) ...[
                SizedBox(height: 16),
                Text(
                  '自己紹介:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade700,
                  ),
                ),
                SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Text(
                    currentUserData['introduction'],
                    style: TextStyle(fontSize: 14, height: 1.4),
                  ),
                ),
              ],
              if (currentUserData['tags'] != null && (currentUserData['tags'] as List).isNotEmpty) ...[
                SizedBox(height: 16),
                Text(
                  'タグ:',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey.shade700,
                  ),
                ),
                SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: (currentUserData['tags'] as List<dynamic>).map((tag) {
                    return Container(
                      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.pink.shade50,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.pink.shade200),
                      ),
                      child: Text(
                        tag.toString(),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.pink.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
              SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: AnimatedContainer(
                      duration: Duration(milliseconds: 300),
                      child: ElevatedButton.icon(
                        onPressed: () => _toggleOnlineStatus(context, currentUserData),
                        icon: Icon((currentUserData['isOnline'] == true) ? Icons.pause : Icons.play_arrow),
                        label: Text((currentUserData['isOnline'] == true) ? 'オフラインにする' : 'オンラインにする'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: (currentUserData['isOnline'] == true) ? Colors.grey.shade600 : Colors.green.shade600,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          padding: EdgeInsets.symmetric(vertical: 12),
                          elevation: 3,
                        ),
                      ),
                    ),
                  ),
                  SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () => _editProfile(context, currentUserData),
                      icon: Icon(Icons.edit),
                      label: Text('プロフィール編集'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.pink.shade600,
                        side: BorderSide(color: Colors.pink.shade600),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        padding: EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade600,
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  void _toggleOnlineStatus(BuildContext context, Map<String, dynamic> currentUserData) async {
    try {
      final newStatus = !(currentUserData['isOnline'] == true);
      
      await FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .update({
        'isOnline': newStatus,
        'lastSeen': FieldValue.serverTimestamp(),
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            newStatus ? '✅ オンラインになりました♪' : '⏸️ オフラインになりました',
          ),
          backgroundColor: newStatus ? Colors.green : Colors.grey.shade600,
          duration: Duration(seconds: 2),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('ステータス更新に失敗しました: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _editProfile(BuildContext context, Map<String, dynamic> currentUserData) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => EditProfileScreen(userData: currentUserData, uid: uid),
      ),
    );
  }

  void _logout(BuildContext context) async {
    try {
      await FirebaseFirestore.instance
          .collection('users')
          .doc(uid)
          .update({
        'lastSeen': FieldValue.serverTimestamp(),
      });

      await FirebaseAuth.instance.signOut();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('ログアウトに失敗しました')),
      );
    }
  }
}

// 修正されたスケジュール管理画面
class ScheduleManagementScreen extends StatefulWidget {
  final Map<String, dynamic> userData;
  final String uid;

  ScheduleManagementScreen({required this.userData, required this.uid});

  @override
  _ScheduleManagementScreenState createState() => _ScheduleManagementScreenState();
}

class _ScheduleManagementScreenState extends State<ScheduleManagementScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  Map<DateTime, List<Map<String, dynamic>>> _schedules = {};

  @override
  void initState() {
    super.initState();
    final today = DateTime.now();
    _selectedDay = DateTime(today.year, today.month, today.day);
    _loadSchedules();
  }

  void _loadSchedules() {
    FirebaseFirestore.instance
        .collection('schedules')
        .where('girlUid', isEqualTo: widget.uid)
        .snapshots()
        .listen((snapshot) {
      final scheduleMap = <DateTime, List<Map<String, dynamic>>>{};
      
      for (var doc in snapshot.docs) {
        try {
          final data = doc.data();
          final date = (data['date'] as Timestamp).toDate();
          final dateKey = DateTime(date.year, date.month, date.day);
          
          if (scheduleMap[dateKey] == null) {
            scheduleMap[dateKey] = [];
          }
          scheduleMap[dateKey]!.add({...data, 'id': doc.id});
        } catch (e) {
          print('スケジュール処理エラー: $e');
        }
      }
      
      if (mounted) {
        setState(() {
          _schedules = scheduleMap;
        });
      }
    });
  }

  List<Map<String, dynamic>> _getSchedulesForDay(DateTime day) {
    return _schedules[DateTime(day.year, day.month, day.day)] ?? [];
  }

  bool _isSameDay(DateTime? a, DateTime? b) {
    if (a == null || b == null) return false;
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  void _showAppleStyleAddScheduleDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AppleStyleTimePickerDialog(
        onConfirm: (TimeOfDay startTime, TimeOfDay endTime) {
          _addSchedule(startTime, endTime);
        },
      ),
    );
  }

  Future<void> _addSchedule(TimeOfDay startTime, TimeOfDay endTime) async {
    try {
      final selectedDate = _selectedDay!;
      final baseDate = DateTime(selectedDate.year, selectedDate.month, selectedDate.day);
      final startDateTime = DateTime(
        baseDate.year,
        baseDate.month,
        baseDate.day,
        startTime.hour,
        startTime.minute,
      );
      final endDateTime = DateTime(
        baseDate.year,
        baseDate.month,
        baseDate.day,
        endTime.hour,
        endTime.minute,
      );

      if (endDateTime.isBefore(startDateTime)) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('終了時間は開始時間より後に設定してください'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      final existingSchedules = _schedules[baseDate] ?? [];
      bool hasConflict = existingSchedules.any((schedule) {
        final existingStart = (schedule['startTime'] as Timestamp).toDate();
        final existingEnd = (schedule['endTime'] as Timestamp).toDate();
        
        return (startDateTime.isBefore(existingEnd) && endDateTime.isAfter(existingStart));
      });

      if (hasConflict) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('指定した時間帯に既にスケジュールがあります'),
            backgroundColor: Colors.orange,
          ),
        );
        return;
      }

      await FirebaseFirestore.instance.collection('schedules').add({
        'girlUid': widget.uid,
        'date': Timestamp.fromDate(baseDate),
        'startTime': Timestamp.fromDate(startDateTime),
        'endTime': Timestamp.fromDate(endDateTime),
        'isAvailable': true,
        'createdAt': FieldValue.serverTimestamp(),
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('スケジュールを追加しました'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      print('スケジュール追加エラー: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('スケジュール追加に失敗しました: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _deleteSchedule(String scheduleId) async {
    try {
      await FirebaseFirestore.instance
          .collection('schedules')
          .doc(scheduleId)
          .delete();

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('スケジュールを削除しました'),
          backgroundColor: Colors.orange,
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('削除に失敗しました'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 2,
                  offset: Offset(0, 1),
                ),
              ],
            ),
            child: Text(
              'スケジュール管理',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
          ),
          Expanded(
            child: _buildScheduleContent(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAppleStyleAddScheduleDialog(),
        backgroundColor: Colors.pink.shade600,
        child: Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildScheduleContent() {
    final selectedDaySchedules = _getSchedulesForDay(_selectedDay ?? DateTime.now());
    
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
      ),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Text(
              '${_selectedDay?.month}/${_selectedDay?.day}のスケジュール',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey.shade800,
              ),
            ),
          ),
          Expanded(
            child: selectedDaySchedules.isEmpty
                ? _buildEmptyState()
                : _buildScheduleList(selectedDaySchedules),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.grey.shade100,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.schedule,
              size: 40,
              color: Colors.grey.shade400,
            ),
          ),
          SizedBox(height: 16),
          Text(
            'この日はスケジュールがありません',
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey.shade600,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 8),
          Text(
            '空き時間を追加してお客様に表示しましょう',
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScheduleList(List<Map<String, dynamic>> schedules) {
    return ListView.builder(
      padding: EdgeInsets.all(16),
      itemCount: schedules.length,
      itemBuilder: (context, index) {
        final schedule = schedules[index];
        final startTime = (schedule['startTime'] as Timestamp).toDate();
        final endTime = (schedule['endTime'] as Timestamp).toDate();
        final isAvailable = schedule['isAvailable'] ?? true;
        
        return Card(
          margin: EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: isAvailable ? Colors.green : Colors.grey,
                shape: BoxShape.circle,
              ),
            ),
            title: Text(
              '${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')} - ${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            subtitle: Text(
              isAvailable ? '空き時間' : '予約済み',
              style: TextStyle(
                color: isAvailable ? Colors.green : Colors.grey,
              ),
            ),
            trailing: PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'delete') {
                  _deleteSchedule(schedule['id']);
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, color: Colors.red),
                      SizedBox(width: 8),
                      Text('削除'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// Apple Watch風の時間選択ダイアログ
class AppleStyleTimePickerDialog extends StatefulWidget {
  final Function(TimeOfDay startTime, TimeOfDay endTime) onConfirm;

  AppleStyleTimePickerDialog({required this.onConfirm});

  @override
  _AppleStyleTimePickerDialogState createState() => _AppleStyleTimePickerDialogState();
}

class _AppleStyleTimePickerDialogState extends State<AppleStyleTimePickerDialog> {
  int _startHour = 9;
  int _startMinute = 0;
  int _endHour = 10;
  int _endMinute = 0;
  
  final FixedExtentScrollController _startHourController = FixedExtentScrollController();
  final FixedExtentScrollController _startMinuteController = FixedExtentScrollController();
  final FixedExtentScrollController _endHourController = FixedExtentScrollController();
  final FixedExtentScrollController _endMinuteController = FixedExtentScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startHourController.jumpToItem(_startHour);
      _startMinuteController.jumpToItem(_startMinute ~/ 5);
      _endHourController.jumpToItem(_endHour);
      _endMinuteController.jumpToItem(_endMinute ~/ 5);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.6,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 40,
            height: 4,
            margin: EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: Text('キャンセル', style: TextStyle(color: Colors.grey.shade600)),
                ),
                Text(
                  '空き時間を追加',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade800,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    final startTime = TimeOfDay(hour: _startHour, minute: _startMinute);
                    final endTime = TimeOfDay(hour: _endHour, minute: _endMinute);
                    
                    widget.onConfirm(startTime, endTime);
                    Navigator.pop(context);
                  },
                  child: Text(
                    '追加',
                    style: TextStyle(
                      color: Colors.pink.shade600,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Divider(height: 1),
          Expanded(
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                children: [
                  _buildTimePickerSection('開始時間', true),
                  SizedBox(height: 30),
                  _buildTimePickerSection('終了時間', false),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTimePickerSection(String title, bool isStartTime) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade700,
          ),
        ),
        SizedBox(height: 12),
        Container(
          height: 120,
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            children: [
              Expanded(
                child: _buildWheelPicker(
                  controller: isStartTime ? _startHourController : _endHourController,
                  itemCount: 24,
                  onSelectedItemChanged: (index) {
                    setState(() {
                      if (isStartTime) {
                        _startHour = index;
                      } else {
                        _endHour = index;
                      }
                    });
                  },
                  itemBuilder: (index) => '${index.toString().padLeft(2, '0')}時',
                ),
              ),
              Container(
                width: 1,
                height: 60,
                color: Colors.grey.shade300,
              ),
              Expanded(
                child: _buildWheelPicker(
                  controller: isStartTime ? _startMinuteController : _endMinuteController,
                  itemCount: 12,
                  onSelectedItemChanged: (index) {
                    setState(() {
                      final minute = index * 5;
                      if (isStartTime) {
                        _startMinute = minute;
                      } else {
                        _endMinute = minute;
                      }
                    });
                  },
                  itemBuilder: (index) => '${(index * 5).toString().padLeft(2, '0')}分',
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildWheelPicker({
    required FixedExtentScrollController controller,
    required int itemCount,
    required ValueChanged<int> onSelectedItemChanged,
    required String Function(int) itemBuilder,
  }) {
    return ListWheelScrollView.useDelegate(
      controller: controller,
      itemExtent: 40,
      perspective: 0.005,
      diameterRatio: 1.2,
      physics: FixedExtentScrollPhysics(),
      onSelectedItemChanged: onSelectedItemChanged,
      childDelegate: ListWheelChildBuilderDelegate(
        childCount: itemCount,
        builder: (context, index) {
          return Container(
            alignment: Alignment.center,
            child: Text(
              itemBuilder(index),
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w500,
                color: Colors.grey.shade800,
              ),
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _startHourController.dispose();
    _startMinuteController.dispose();
    _endHourController.dispose();
    _endMinuteController.dispose();
    super.dispose();
  }
}

// 修正された予約管理画面
class BookingManagementScreen extends StatelessWidget {
  final Map<String, dynamic> userData;
  final String uid;

  BookingManagementScreen({required this.userData, required this.uid});

  @override
  Widget build(BuildContext context) {
    print('=== BookingManagementScreen デバッグ ===');
    print('uid: $uid');
    
    return StreamBuilder<QuerySnapshot>(
      // 修正1: orderByを削除してシンプルなクエリにする
      stream: FirebaseFirestore.instance
          .collection('bookings')
          .where('girlUid', isEqualTo: uid)
          .snapshots(),
      builder: (context, snapshot) {
        print('=== StreamBuilder状態 ===');
        print('connectionState: ${snapshot.connectionState}');
        print('hasData: ${snapshot.hasData}');
        print('hasError: ${snapshot.hasError}');
        
        if (snapshot.hasError) {
          print('エラー詳細: ${snapshot.error}');
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 64, color: Colors.red),
                SizedBox(height: 16),
                Text(
                  'エラーが発生しました',
                  style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                ),
                SizedBox(height: 8),
                Text(
                  '${snapshot.error}',
                  style: TextStyle(fontSize: 12, color: Colors.red),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 16),
                ElevatedButton(
                  onPressed: () {
                    // 画面を再描画
                    (context as Element).markNeedsBuild();
                  },
                  child: Text('再試行'),
                ),
              ],
            ),
          );
        }

        if (snapshot.connectionState == ConnectionState.waiting) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircularProgressIndicator(color: Colors.pink.shade600),
                SizedBox(height: 16),
                Text('予約を読み込み中...'),
              ],
            ),
          );
        }

        if (!snapshot.hasData) {
          print('snapshot.data is null');
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('📋', style: TextStyle(fontSize: 64)),
                SizedBox(height: 16),
                Text(
                  'データが取得できませんでした',
                  style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                ),
              ],
            ),
          );
        }

        final docs = snapshot.data!.docs;
        print('取得したドキュメント数: ${docs.length}');
        
        // 修正2: データをソートして処理
        final bookings = docs.map((doc) {
          final data = doc.data() as Map<String, dynamic>;
          print('予約データ: $data');
          return {
            'id': doc.id,
            ...data,
          };
        }).toList();

        // 修正3: startTimeでソート（null安全）
        bookings.sort((a, b) {
          try {
            final aTime = a['startTime'] as Timestamp?;
            final bTime = b['startTime'] as Timestamp?;
            
            if (aTime == null && bTime == null) return 0;
            if (aTime == null) return 1;
            if (bTime == null) return -1;
            
            return aTime.compareTo(bTime);
          } catch (e) {
            print('ソートエラー: $e');
            return 0;
          }
        });

        if (bookings.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('📋', style: TextStyle(fontSize: 64)),
                SizedBox(height: 16),
                Text(
                  '予約はありません',
                  style: TextStyle(fontSize: 18, color: Colors.grey.shade600),
                ),
                SizedBox(height: 8),
                Text(
                  'お客様からの予約をお待ちください',
                  style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 16),
                if (kDebugMode)
                  Text(
                    'デバッグ情報: ${docs.length}件のドキュメントを取得',
                    style: TextStyle(fontSize: 12, color: Colors.blue),
                  ),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: EdgeInsets.all(16),
          itemCount: bookings.length,
          itemBuilder: (context, index) {
            final bookingData = bookings[index];
            return _buildBookingCard(context, bookingData, bookingData['id']);
          },
        );
      },
    );
  }

  Widget _buildBookingCard(BuildContext context, Map<String, dynamic> bookingData, String bookingId) {
    try {
      // 修正4: null安全なデータ取得
      final startTime = bookingData['startTime'] as Timestamp?;
      final endTime = bookingData['endTime'] as Timestamp?;
      final status = bookingData['status'] ?? 'pending';
      
      if (startTime == null || endTime == null) {
        return Card(
          margin: EdgeInsets.only(bottom: 16),
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'データエラー',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.red),
                ),
                Text('予約ID: $bookingId'),
                if (kDebugMode) Text('データ: ${bookingData.toString()}'),
              ],
            ),
          ),
        );
      }

      final startDateTime = startTime.toDate();
      final endDateTime = endTime.toDate();
      
      Color statusColor;
      String statusText;
      IconData statusIcon;
      
      switch (status) {
        case 'confirmed':
          statusColor = Colors.green;
          statusText = '予約確定';
          statusIcon = Icons.check_circle;
          break;
        case 'rejected':
          statusColor = Colors.red;
          statusText = '拒否済み';
          statusIcon = Icons.cancel;
          break;
        case 'completed':
          statusColor = Colors.blue;
          statusText = '完了';
          statusIcon = Icons.done_all;
          break;
        case 'cancelled':
          statusColor = Colors.orange;
          statusText = 'キャンセル';
          statusIcon = Icons.cancel_outlined;
          break;
        default:
          statusColor = Colors.orange;
          statusText = '承認待ち';
          statusIcon = Icons.hourglass_empty;
      }

      return Card(
        margin: EdgeInsets.only(bottom: 16),
        elevation: 4,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      bookingData['customerName'] ?? 'お客様',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                  ),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(statusIcon, size: 16, color: statusColor),
                        SizedBox(width: 4),
                        Text(
                          statusText,
                          style: TextStyle(
                            color: statusColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.schedule, size: 16, color: Colors.grey.shade600),
                  SizedBox(width: 8),
                  Text(
                    '${startDateTime.month}/${startDateTime.day} ${startDateTime.hour}:${startDateTime.minute.toString().padLeft(2, '0')} - ${endDateTime.hour}:${endDateTime.minute.toString().padLeft(2, '0')}',
                    style: TextStyle(color: Colors.grey.shade700),
                  ),
                ],
              ),
              SizedBox(height: 8),
              Row(
                children: [
                  Icon(Icons.location_on, size: 16, color: Colors.grey.shade600),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      bookingData['location'] ?? '場所未指定',
                      style: TextStyle(color: Colors.grey.shade700),
                    ),
                  ),
                ],
              ),
              if (bookingData['message']?.isNotEmpty == true) ...[
                SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.message, size: 16, color: Colors.grey.shade600),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        bookingData['message'],
                        style: TextStyle(color: Colors.grey.shade700),
                      ),
                    ),
                  ],
                ),
              ],
              
              // デバッグ情報（開発時のみ表示）
              if (kDebugMode) ...[
                SizedBox(height: 8),
                Container(
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'Debug: $bookingId\nStatus: $status\nData: ${bookingData.keys.join(', ')}',
                    style: TextStyle(fontSize: 10, color: Colors.blue.shade700),
                  ),
                ),
              ],
              
              if (status == 'pending') ...[
                SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _updateBookingStatus(context, bookingId, 'rejected'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red.shade600,
                          side: BorderSide(color: Colors.red.shade600),
                        ),
                        child: Text('拒否'),
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _updateBookingStatus(context, bookingId, 'confirmed'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green.shade600,
                          foregroundColor: Colors.white,
                        ),
                        child: Text('承認'),
                      ),
                    ),
                  ],
                ),
              ],
              if (status == 'confirmed') ...[
                SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => _updateBookingStatus(context, bookingId, 'completed'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue.shade600,
                      foregroundColor: Colors.white,
                    ),
                    child: Text('完了にする'),
                  ),
                ),
              ],
            ],
          ),
        ),
      );
    } catch (e) {
      print('カード描画エラー: $e');
      return Card(
        margin: EdgeInsets.only(bottom: 16),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'カード描画エラー',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.red),
              ),
              Text('エラー: $e'),
              Text('予約ID: $bookingId'),
            ],
          ),
        ),
      );
    }
  }

  Future<void> _updateBookingStatus(BuildContext context, String bookingId, String newStatus) async {
    try {
      print('予約ステータス更新: $bookingId -> $newStatus');
      
      await FirebaseFirestore.instance
          .collection('bookings')
          .doc(bookingId)
          .update({
        'status': newStatus,
        'updatedAt': FieldValue.serverTimestamp(),
      });

      String message;
      switch (newStatus) {
        case 'confirmed':
          message = '予約を承認しました';
          break;
        case 'rejected':
          message = '予約を拒否しました';
          break;
        case 'completed':
          message = '予約を完了にしました';
          break;
        default:
          message = 'ステータスを更新しました';
      }

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      print('ステータス更新エラー: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('更新に失敗しました: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}

// デバッグ用の予約確認画面
class DebugBookingScreen extends StatelessWidget {
  final String uid;

  DebugBookingScreen({required this.uid});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Container(
            padding: EdgeInsets.all(16),
            color: Colors.blue.shade50,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('デバッグ情報:', style: TextStyle(fontWeight: FontWeight.bold)),
                Text('現在のUID: $uid'),
                Text('現在時刻: ${DateTime.now()}'),
              ],
            ),
          ),
          Expanded(
            child: StreamBuilder<QuerySnapshot>(
              // 最もシンプルなクエリから開始
              stream: FirebaseFirestore.instance
                  .collection('bookings')
                  .snapshots(),
              builder: (context, snapshot) {
                if (snapshot.hasError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('エラー:', style: TextStyle(color: Colors.red, fontSize: 18)),
                        SizedBox(height: 8),
                        Text('${snapshot.error}', style: TextStyle(fontSize: 12)),
                        SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            print('Firebase Auth Current User: ${FirebaseAuth.instance.currentUser}');
                            print('UID: $uid');
                          },
                          child: Text('ログ出力'),
                        ),
                      ],
                    ),
                  );
                }

                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(child: CircularProgressIndicator());
                }

                if (!snapshot.hasData) {
                  return Center(child: Text('データなし'));
                }

                final allDocs = snapshot.data!.docs;
                print('=== 全予約データ ===');
                print('総ドキュメント数: ${allDocs.length}');

                // 全データを表示
                return ListView.builder(
                  itemCount: allDocs.length,
                  itemBuilder: (context, index) {
                    final doc = allDocs[index];
                    final data = doc.data() as Map<String, dynamic>;
                    
                    print('ドキュメント ${index + 1}: ${doc.id}');
                    print('データ: $data');
                    
                    final isMyBooking = data['girlUid'] == uid;
                    
                    return Card(
                      margin: EdgeInsets.all(8),
                      color: isMyBooking ? Colors.green.shade50 : Colors.grey.shade100,
                      child: Padding(
                        padding: EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  isMyBooking ? Icons.check_circle : Icons.info_outline,
                                  color: isMyBooking ? Colors.green : Colors.grey,
                                ),
                                SizedBox(width: 8),
                                Text(
                                  isMyBooking ? '自分の予約' : '他の人の予約',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: isMyBooking ? Colors.green.shade700 : Colors.grey.shade700,
                                  ),
                                ),
                              ],
                            ),
                            SizedBox(height: 8),
                            Text('ID: ${doc.id}'),
                            Text('Customer: ${data['customerName'] ?? 'N/A'}'),
                            Text('Girl: ${data['girlName'] ?? 'N/A'}'),
                            Text('CustomerUID: ${data['customerUid'] ?? 'N/A'}'),
                            Text('GirlUID: ${data['girlUid'] ?? 'N/A'}'),
                            Text('Status: ${data['status'] ?? 'N/A'}'),
                            Text('Location: ${data['location'] ?? 'N/A'}'),
                            
                            // 時間情報の詳細表示
                            if (data['startTime'] != null) ...[
                              SizedBox(height: 4),
                              Text('StartTime型: ${data['startTime'].runtimeType}'),
                              if (data['startTime'] is Timestamp)
                                Text('StartTime: ${(data['startTime'] as Timestamp).toDate()}')
                              else
                                Text('StartTime (raw): ${data['startTime']}'),
                            ] else
                              Text('StartTime: null', style: TextStyle(color: Colors.red)),
                              
                            if (data['endTime'] != null) ...[
                              Text('EndTime型: ${data['endTime'].runtimeType}'),
                              if (data['endTime'] is Timestamp)
                                Text('EndTime: ${(data['endTime'] as Timestamp).toDate()}')
                              else
                                Text('EndTime (raw): ${data['endTime']}'),
                            ] else
                              Text('EndTime: null', style: TextStyle(color: Colors.red)),
                              
                            SizedBox(height: 8),
                            Text(
                              '全フィールド: ${data.keys.join(', ')}',
                              style: TextStyle(fontSize: 11, color: Colors.blue.shade600),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          FloatingActionButton(
            onPressed: () => _testBookingQuery(uid),
            child: Icon(Icons.search),
            tooltip: '予約検索テスト',
            heroTag: 'search',
          ),
          SizedBox(height: 16),
          FloatingActionButton(
            onPressed: () => _createTestBooking(uid),
            child: Icon(Icons.add),
            tooltip: 'テスト予約作成',
            heroTag: 'add',
          ),
        ],
      ),
    );
  }

  void _testBookingQuery(String uid) async {
    print('=== 予約検索テスト開始 ===');
    
    try {
      // テスト1: 基本クエリ
      final basicQuery = await FirebaseFirestore.instance
          .collection('bookings')
          .get();
      print('基本クエリ結果: ${basicQuery.docs.length}件');

      // テスト2: girlUidフィルター
      final filteredQuery = await FirebaseFirestore.instance
          .collection('bookings')
          .where('girlUid', isEqualTo: uid)
          .get();
      print('フィルター済みクエリ結果: ${filteredQuery.docs.length}件');

      // テスト3: 各ドキュメントの詳細
      for (var doc in filteredQuery.docs) {
        final data = doc.data();
        print('マッチしたドキュメント: ${doc.id}');
        print('  - customerName: ${data['customerName']}');
        print('  - girlUid: ${data['girlUid']}');
        print('  - status: ${data['status']}');
        print('  - startTime: ${data['startTime']} (${data['startTime'].runtimeType})');
      }

    } catch (e) {
      print('検索エラー: $e');
    }
  }

  void _createTestBooking(String uid) async {
    print('=== テスト予約作成 ===');
    
    try {
      final now = DateTime.now();
      final testBooking = {
        'customerUid': 'test_customer_uid',
        'customerName': 'テストお客様',
        'girlUid': uid,
        'girlName': 'テストキャスト',
        'startTime': Timestamp.fromDate(now.add(Duration(hours: 1))),
        'endTime': Timestamp.fromDate(now.add(Duration(hours: 3))),
        'location': 'テスト場所',
        'message': 'これはテスト予約です',
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      };

      final docRef = await FirebaseFirestore.instance
          .collection('bookings')
          .add(testBooking);
      
      print('テスト予約作成成功: ${docRef.id}');
      
    } catch (e) {
      print('テスト予約作成エラー: $e');
    }
  }
}

// 修正されたカレンダー予約画面
class CalendarScreen extends StatefulWidget {
  final Map<String, dynamic> girlData;
  final String girlUid;
  final Map<String, dynamic> customerData;
  final String customerUid;

  CalendarScreen({
    required this.girlData,
    required this.girlUid,
    required this.customerData,
    required this.customerUid,
  });

  @override
  _CalendarScreenState createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  Map<DateTime, List<Map<String, dynamic>>> _schedules = {};
  List<Map<String, dynamic>> _availableSlots = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final today = DateTime.now();
    _selectedDay = DateTime(today.year, today.month, today.day);
    _focusedDay = _selectedDay!;
    _loadSchedules();
  }

  void _loadSchedules() {
    setState(() {
      _isLoading = true;
    });

    FirebaseFirestore.instance
        .collection('schedules')
        .where('girlUid', isEqualTo: widget.girlUid)
        .where('isAvailable', isEqualTo: true)
        .snapshots()
        .listen((snapshot) {
      print('=== スケジュール取得 ===');
      print('取得件数: ${snapshot.docs.length}');
      
      final scheduleMap = <DateTime, List<Map<String, dynamic>>>{};
      
      for (var doc in snapshot.docs) {
        try {
          final data = doc.data();
          final date = (data['date'] as Timestamp).toDate();
          final dateKey = DateTime(date.year, date.month, date.day);
          
          print('スケジュール: $dateKey - ${data['startTime']} - ${data['endTime']}');
          
          if (scheduleMap[dateKey] == null) {
            scheduleMap[dateKey] = [];
          }
          scheduleMap[dateKey]!.add({...data, 'id': doc.id});
        } catch (e) {
          print('スケジュール処理エラー: $e');
        }
      }
      
      if (mounted) {
        setState(() {
          _schedules = scheduleMap;
          _isLoading = false;
          _updateAvailableSlots();
        });
        print('UI更新完了 - 総スケジュール数: ${_schedules.length}');
      }
    }, onError: (error) {
      print('スケジュール取得エラー: $error');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    });
  }

  void _updateAvailableSlots() {
    if (_selectedDay != null) {
      final dayKey = DateTime(_selectedDay!.year, _selectedDay!.month, _selectedDay!.day);
      final slots = _schedules[dayKey] ?? [];
      print('=== 選択日のスロット更新 ===');
      print('選択日: $dayKey');
      print('スロット数: ${slots.length}');
      _availableSlots = slots;
    }
  }

  bool _isSameDay(DateTime? a, DateTime? b) {
    if (a == null || b == null) return false;
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  List<Map<String, dynamic>> _getSchedulesForDay(DateTime day) {
    final dayKey = DateTime(day.year, day.month, day.day);
    return _schedules[dayKey] ?? [];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('${widget.girlData['nickname']}さんの予約'),
        backgroundColor: Colors.purple.shade600,
        foregroundColor: Colors.white,
        actions: [
          if (kDebugMode)
            IconButton(
              onPressed: () {
                print('=== デバッグ情報 ===');
                print('選択日: $_selectedDay');
                print('フォーカス日: $_focusedDay');
                print('全スケジュール: ${_schedules.keys}');
                print('利用可能スロット: ${_availableSlots.length}');
              },
              icon: Icon(Icons.bug_report),
            ),
        ],
      ),
      body: _isLoading
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(color: Colors.purple.shade600),
                  SizedBox(height: 16),
                  Text('スケジュールを読み込み中...'),
                ],
              ),
            )
          : Column(
              children: [
                _buildCustomCalendar(),
                SizedBox(height: 8),
                Expanded(
                  child: Container(
                    padding: EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(
                              '${_selectedDay?.month}/${_selectedDay?.day}の空き時間',
                              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(width: 8),
                            Container(
                              padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.purple.shade100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${_availableSlots.length}件',
                                style: TextStyle(
                                  color: Colors.purple.shade700,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 16),
                        Expanded(
                          child: _buildAvailableSlots(),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          setState(() {
            _loadSchedules();
          });
        },
        backgroundColor: Colors.purple.shade600,
        child: Icon(Icons.refresh, color: Colors.white),
        tooltip: 'スケジュール更新',
      ),
    );
  }

  Widget _buildCustomCalendar() {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              IconButton(
                onPressed: () {
                  setState(() {
                    _focusedDay = DateTime(_focusedDay.year, _focusedDay.month - 1);
                  });
                },
                icon: Icon(Icons.chevron_left),
                tooltip: '前の月',
              ),
              Text(
                '${_focusedDay.year}年${_focusedDay.month}月',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              IconButton(
                onPressed: () {
                  setState(() {
                    _focusedDay = DateTime(_focusedDay.year, _focusedDay.month + 1);
                  });
                },
                icon: Icon(Icons.chevron_right),
                tooltip: '次の月',
              ),
            ],
          ),
          SizedBox(height: 16),
          _buildCalendarGrid(),
        ],
      ),
    );
  }

  Widget _buildCalendarGrid() {
    final firstDayOfMonth = DateTime(_focusedDay.year, _focusedDay.month, 1);
    final lastDayOfMonth = DateTime(_focusedDay.year, _focusedDay.month + 1, 0);
    final firstDayOfWeek = firstDayOfMonth.weekday - 1;
    
    final weekdays = ['月', '火', '水', '木', '金', '土', '日'];
    
    return Column(
      children: [
        Row(
          children: weekdays.map((day) {
            return Expanded(
              child: Container(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  day,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontWeight: FontWeight.bold, 
                    color: Colors.grey.shade600
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        Container(
          height: 240,
          child: GridView.builder(
            physics: NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 1,
            ),
            itemCount: 42,
            itemBuilder: (context, index) {
              final dayOfMonth = index - firstDayOfWeek + 1;
              
              if (dayOfMonth < 1 || dayOfMonth > lastDayOfMonth.day) {
                return Container();
              }

              final currentDate = DateTime(_focusedDay.year, _focusedDay.month, dayOfMonth);
              final isPastDate = currentDate.isBefore(DateTime.now().subtract(Duration(days: 1)));
              final isSelected = _isSameDay(_selectedDay, currentDate);
              final isToday = _isSameDay(DateTime.now(), currentDate);
              final hasSchedules = _getSchedulesForDay(currentDate).isNotEmpty;

              return GestureDetector(
                onTap: isPastDate ? null : () {
                  print('日付選択: $currentDate');
                  setState(() {
                    _selectedDay = currentDate;
                    _updateAvailableSlots();
                  });
                },
                child: Container(
                  margin: EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: isPastDate 
                        ? Colors.grey.shade200
                        : isSelected 
                            ? Colors.purple.shade600
                            : isToday 
                                ? Colors.purple.shade100
                                : Colors.transparent,
                    borderRadius: BorderRadius.circular(8),
                    border: hasSchedules && !isPastDate && !isSelected
                        ? Border.all(color: Colors.green, width: 2) 
                        : null,
                  ),
                  child: Stack(
                    children: [
                      Center(
                        child: Text(
                          dayOfMonth.toString(),
                          style: TextStyle(
                            color: isPastDate 
                                ? Colors.grey.shade500
                                : isSelected 
                                    ? Colors.white 
                                    : isToday 
                                        ? Colors.purple.shade700
                                        : Colors.black,
                            fontWeight: isSelected || isToday ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ),
                      if (hasSchedules && !isSelected && !isPastDate)
                        Positioned(
                          bottom: 4,
                          right: 4,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: Colors.green,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                      if (isSelected)
                        Positioned(
                          top: 4,
                          right: 4,
                          child: Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildLegendItem(Colors.green, '空きあり'),
            SizedBox(width: 16),
            _buildLegendItem(Colors.purple.shade600, '選択中'),
            SizedBox(width: 16),
            _buildLegendItem(Colors.purple.shade100, '今日'),
          ],
        ),
      ],
    );
  }

  Widget _buildLegendItem(Color color, String text) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        SizedBox(width: 4),
        Text(
          text,
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
      ],
    );
  }

  Widget _buildAvailableSlots() {
    if (_availableSlots.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.calendar_today,
                size: 50,
                color: Colors.grey.shade400,
              ),
            ),
            SizedBox(height: 16),
            Text(
              'この日は空きがありません',
              style: TextStyle(
                fontSize: 16, 
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
            SizedBox(height: 8),
            Text(
              '他の日を選んでみてください',
              style: TextStyle(
                fontSize: 14, 
                color: Colors.grey.shade500,
              ),
            ),
            SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () {
                setState(() {
                  _selectedDay = DateTime.now();
                  _focusedDay = DateTime.now();
                  _updateAvailableSlots();
                });
              },
              icon: Icon(Icons.today),
              label: Text('今日に戻る'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.purple.shade600,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        _loadSchedules();
      },
      child: ListView.builder(
        itemCount: _availableSlots.length,
        itemBuilder: (context, index) {
          final slot = _availableSlots[index];
          return _buildSlotCard(slot, index);
        },
      ),
    );
  }

  Widget _buildSlotCard(Map<String, dynamic> slot, int index) {
    final startTime = (slot['startTime'] as Timestamp).toDate();
    final endTime = (slot['endTime'] as Timestamp).toDate();
    
    return Card(
      margin: EdgeInsets.only(bottom: 12),
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: [Colors.white, Colors.green.shade50.withOpacity(0.3)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: ListTile(
          contentPadding: EdgeInsets.all(16),
          leading: Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: Colors.green.shade100,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.green.shade300, width: 2),
            ),
            child: Icon(
              Icons.schedule,
              color: Colors.green.shade600,
              size: 24,
            ),
          ),
          title: Text(
            '${startTime.hour.toString().padLeft(2, '0')}:${startTime.minute.toString().padLeft(2, '0')} - ${endTime.hour.toString().padLeft(2, '0')}:${endTime.minute.toString().padLeft(2, '0')}',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.check_circle, size: 16, color: Colors.green),
                  SizedBox(width: 4),
                  Text(
                    '空き時間',
                    style: TextStyle(color: Colors.green.shade700),
                  ),
                ],
              ),
              SizedBox(height: 4),
              Text(
                '時給: ${widget.girlData['hourlyRate'] ?? '要相談'}円/時間',
                style: TextStyle(
                  color: Colors.purple.shade600,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          trailing: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [Colors.purple.shade600, Colors.purple.shade500],
              ),
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: Colors.purple.shade300.withOpacity(0.5),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: ElevatedButton(
              onPressed: () => _showBookingDialog(slot),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                foregroundColor: Colors.white,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: Text(
                '予約',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ),
      ),
    );
  }

  void _showBookingDialog(Map<String, dynamic> slot) {
    final TextEditingController locationController = TextEditingController();
    final TextEditingController messageController = TextEditingController();
    
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return Dialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          child: Container(
            constraints: BoxConstraints(maxWidth: 400),
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.purple.shade100,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        Icons.calendar_today,
                        color: Colors.purple.shade600,
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '予約確認',
                        style: TextStyle(
                          fontSize: 20, 
                          fontWeight: FontWeight.bold,
                          color: Colors.grey.shade800,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: Icon(Icons.close),
                      color: Colors.grey.shade600,
                    ),
                  ],
                ),
                SizedBox(height: 20),
                Container(
                  padding: EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.purple.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.purple.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoRow('キャスト', '${widget.girlData['nickname']}さん'),
                      _buildInfoRow('日付', '${_selectedDay!.month}/${_selectedDay!.day}'),
                      _buildInfoRow('時間', '${(slot['startTime'] as Timestamp).toDate().hour}:${(slot['startTime'] as Timestamp).toDate().minute.toString().padLeft(2, '0')} - ${(slot['endTime'] as Timestamp).toDate().hour}:${(slot['endTime'] as Timestamp).toDate().minute.toString().padLeft(2, '0')}'),
                      if (widget.girlData['hourlyRate'] != null)
                        _buildInfoRow('時給', '${widget.girlData['hourlyRate']}円/時間'),
                    ],
                  ),
                ),
                SizedBox(height: 20),
                TextField(
                  controller: locationController,
                  decoration: InputDecoration(
                    labelText: '待ち合わせ場所 *',
                    hintText: '例：渋谷駅ハチ公前',
                    prefixIcon: Icon(Icons.location_on),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                  ),
                ),
                SizedBox(height: 16),
                TextField(
                  controller: messageController,
                  maxLines: 3,
                  decoration: InputDecoration(
                    labelText: 'メッセージ（任意）',
                    hintText: 'キャストへのメッセージをお書きください',
                    prefixIcon: Icon(Icons.message),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                  ),
                ),
                SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.grey.shade600,
                          side: BorderSide(color: Colors.grey.shade400),
                          padding: EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: Text('キャンセル'),
                      ),
                    ),
                    SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => _submitBooking(
                          slot,
                          locationController.text,
                          messageController.text,
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.purple.shade600,
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          elevation: 2,
                        ),
                        child: Text(
                          '予約する',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 60,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.purple.shade700,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(': ', style: TextStyle(color: Colors.purple.shade700)),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: Colors.grey.shade800,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitBooking(
    Map<String, dynamic> slot,
    String location,
    String message,
  ) async {
    if (location.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.warning, color: Colors.white),
              SizedBox(width: 8),
              Text('待ち合わせ場所を入力してください'),
            ],
          ),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Container(
          padding: EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(color: Colors.purple.shade600),
              SizedBox(height: 16),
              Text('予約を送信中...'),
            ],
          ),
        ),
      ),
    );

    try {
      print('=== 予約作成開始 ===');
      final bookingData = {
        'customerUid': widget.customerUid,
        'customerName': widget.customerData['nickname'],
        'girlUid': widget.girlUid,
        'girlName': widget.girlData['nickname'],
        'startTime': slot['startTime'],
        'endTime': slot['endTime'],
        'location': location.trim(),
        'message': message.trim(),
        'status': 'pending',
        'createdAt': FieldValue.serverTimestamp(),
      };

      print('保存する予約データ: $bookingData');

      final docRef = await FirebaseFirestore.instance.collection('bookings').add(bookingData);
      print('予約が作成されました。ID: ${docRef.id}');

      await FirebaseFirestore.instance
          .collection('schedules')
          .doc(slot['id'])
          .update({'isAvailable': false});
      print('スケジュールを予約済みに更新しました');

      Navigator.pop(context);
      Navigator.pop(context);
      Navigator.pop(context);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 8),
              Expanded(
                child: Text('予約リクエストを送信しました\nキャストからの返答をお待ちください'),
              ),
            ],
          ),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          duration: Duration(seconds: 4),
        ),
      );
    } catch (e) {
      print('予約作成エラー: $e');
      Navigator.pop(context);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Icon(Icons.error, color: Colors.white),
              SizedBox(width: 8),
              Expanded(child: Text('予約に失敗しました: $e')),
            ],
          ),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }
}

class EditProfileScreen extends StatefulWidget {
  final Map<String, dynamic> userData;
  final String uid;

  EditProfileScreen({required this.userData, required this.uid});

  @override
  _EditProfileScreenState createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _nicknameController = TextEditingController();
  final _ageController = TextEditingController();
  final _hourlyRateController = TextEditingController();
  final _introductionController = TextEditingController();
  final _locationController = TextEditingController();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  bool _isLoading = false;
  List<String> _selectedTags = [];
  String? _selectedImageBase64;

  final List<String> _availableTags = [
    '明るい', '聞き上手', '話し好き', '大人しい', 'お酒好き',
    '笑顔が素敵', '優しい', '元気', 'おしゃべり', '癒し系',
    'かわいい系', 'きれい系', 'クール', 'ナチュラル', 'セクシー'
  ];

  @override
  void initState() {
    super.initState();
    _nicknameController.text = widget.userData['nickname'] ?? '';
    _ageController.text = widget.userData['age']?.toString() ?? '';
    _hourlyRateController.text = widget.userData['hourlyRate'] ?? '';
    _introductionController.text = widget.userData['introduction'] ?? '';
    _locationController.text = widget.userData['location'] ?? '';
    _selectedTags = List<String>.from(widget.userData['tags'] ?? []);
    _selectedImageBase64 = widget.userData['profileImage'];
  }

  void _selectImage() async {
    try {
      final html.FileUploadInputElement uploadInput = html.FileUploadInputElement();
      uploadInput.accept = 'image/*';
      uploadInput.click();

      uploadInput.onChange.listen((event) {
        final files = uploadInput.files;
        if (files!.length == 1) {
          final file = files[0];
          
          if (file.size > 5 * 1024 * 1024) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('画像サイズは5MB以下にしてください'),
                backgroundColor: Colors.red,
              ),
            );
            return;
          }
          
          final reader = html.FileReader();
          
          reader.onLoadEnd.listen((event) {
            setState(() {
              _selectedImageBase64 = reader.result as String?;
            });
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('新しい画像を選択しました'),
                backgroundColor: Colors.green,
                duration: Duration(seconds: 2),
              ),
            );
          });
          
          reader.readAsDataUrl(file);
        }
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('画像選択に失敗しました'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  Future<void> _updateProfile() async {
    setState(() {
      _isLoading = true;
    });

    try {
      Map<String, dynamic> updateData = {
        'nickname': _nicknameController.text,
        'age': int.tryParse(_ageController.text) ?? widget.userData['age'],
        'hourlyRate': _hourlyRateController.text.isEmpty ? null : _hourlyRateController.text,
        'introduction': _introductionController.text.isEmpty ? null : _introductionController.text,
        'location': _locationController.text.isEmpty ? null : _locationController.text,
        'tags': _selectedTags,
        'lastSeen': FieldValue.serverTimestamp(),
      };

      if (_selectedImageBase64 != widget.userData['profileImage']) {
        updateData['profileImage'] = _selectedImageBase64;
      }

      await _firestore.collection('users').doc(widget.uid).update(updateData);

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('プロフィールを更新しました'),
          backgroundColor: Colors.green,
        ),
      );

      Navigator.pop(context);

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('更新に失敗しました: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _buildImageEditSection() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [Colors.pink.shade50, Colors.purple.shade50],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              children: [
                Icon(Icons.photo_camera, color: Colors.pink.shade600, size: 24),
                SizedBox(width: 8),
                Text(
                  'プロフィール写真',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.pink.shade700,
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            GestureDetector(
              onTap: _selectImage,
              child: Stack(
                children: [
                  Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.pink.shade300, width: 3),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.pink.shade200.withOpacity(0.5),
                          blurRadius: 10,
                          offset: Offset(0, 5),
                        ),
                      ],
                    ),
                    child: ClipOval(
                      child: _selectedImageBase64 != null
                          ? Image.network(
                              _selectedImageBase64!,
                              fit: BoxFit.cover,
                              width: 140,
                              height: 140,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  color: Colors.pink.shade50,
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.error_outline,
                                        size: 40,
                                        color: Colors.red.shade400,
                                      ),
                                      Text('画像エラー', style: TextStyle(fontSize: 12)),
                                    ],
                                  ),
                                );
                              },
                            )
                          : Container(
                              color: Colors.pink.shade50,
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.add_a_photo_outlined,
                                    size: 40,
                                    color: Colors.pink.shade400,
                                  ),
                                  SizedBox(height: 8),
                                  Text(
                                    '写真を選択',
                                    style: TextStyle(
                                      color: Colors.pink.shade600,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: Colors.pink.shade600,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.pink.shade300.withOpacity(0.5),
                            blurRadius: 4,
                            offset: Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        Icons.camera_alt,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 16),
            Container(
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.pink.shade100,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                'タップして写真を変更できます',
                style: TextStyle(
                  color: Colors.pink.shade700,
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('プロフィール編集'),
        backgroundColor: Colors.pink.shade600,
        foregroundColor: Colors.white,
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _updateProfile,
            child: Text(
              '保存',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildImageEditSection(),
            SizedBox(height: 24),
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Column(
                  children: [
                    TextField(
                      controller: _nicknameController,
                      decoration: InputDecoration(
                        labelText: 'ニックネーム',
                        prefixIcon: Icon(Icons.person_outline),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _ageController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: '年齢',
                        prefixIcon: Icon(Icons.cake_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _locationController,
                      decoration: InputDecoration(
                        labelText: '地域',
                        prefixIcon: Icon(Icons.location_on_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _hourlyRateController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: '時給',
                        suffixText: '円/時間',
                        prefixIcon: Icon(Icons.monetization_on_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                    SizedBox(height: 16),
                    TextField(
                      controller: _introductionController,
                      maxLines: 4,
                      decoration: InputDecoration(
                        labelText: '自己紹介',
                        prefixIcon: Icon(Icons.edit_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SizedBox(height: 24),
            Text(
              'タグ選択',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.grey.shade800,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'あなたの特徴を表すタグを選んでください（複数選択可）',
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14,
              ),
            ),
            SizedBox(height: 16),
            Card(
              elevation: 4,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: EdgeInsets.all(20),
                child: Wrap(
                  spacing: 12,
                  runSpacing: 12,
                  children: _availableTags.map((tag) {
                    final isSelected = _selectedTags.contains(tag);
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          if (isSelected) {
                            _selectedTags.remove(tag);
                          } else {
                            _selectedTags.add(tag);
                          }
                        });
                      },
                      child: AnimatedContainer(
                        duration: Duration(milliseconds: 200),
                        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        decoration: BoxDecoration(
                          color: isSelected ? Colors.pink.shade500 : Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: isSelected ? Colors.pink.shade500 : Colors.grey.shade300,
                            width: 1,
                          ),
                          boxShadow: isSelected ? [
                            BoxShadow(
                              color: Colors.pink.shade200.withOpacity(0.5),
                              blurRadius: 4,
                              offset: Offset(0, 2),
                            ),
                          ] : null,
                        ),
                        child: Text(
                          tag,
                          style: TextStyle(
                            color: isSelected ? Colors.white : Colors.grey.shade700,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),
            SizedBox(height: 32),
            Container(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _updateProfile,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.pink.shade600,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                  elevation: 5,
                ),
                child: _isLoading
                    ? CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.save, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'プロフィールを更新',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _nicknameController.dispose();
    _ageController.dispose();
    _hourlyRateController.dispose();
    _introductionController.dispose();
    _locationController.dispose();
    super.dispose();
  }
}

class MessageScreen extends StatefulWidget {
  final Map<String, dynamic> customerData;
  final String customerUid;
  final Map<String, dynamic> girlData;
  final String girlUid;

  MessageScreen({
    required this.customerData,
    required this.customerUid,
    required this.girlData,
    required this.girlUid,
  });

  @override
  _MessageScreenState createState() => _MessageScreenState();
}

class _MessageScreenState extends State<MessageScreen> {
  final TextEditingController _messageController = TextEditingController();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final ScrollController _scrollController = ScrollController();
  late String chatId;
  late String currentUserId;

  @override
  void initState() {
    super.initState();
    List<String> ids = [widget.customerUid, widget.girlUid];
    ids.sort();
    chatId = ids.join('_');
    currentUserId = FirebaseAuth.instance.currentUser?.uid ?? '';
    _createInitialMessage();
  }

  Future<void> _createInitialMessage() async {
    try {
      final chatDoc = await _firestore.collection('chats').doc(chatId).get();
      
      if (!chatDoc.exists) {
        await _firestore.collection('chats').doc(chatId).set({
          'participants': [widget.customerUid, widget.girlUid],
          'createdAt': FieldValue.serverTimestamp(),
          'lastMessage': '',
          'lastMessageTime': null,
          'lastMessageSender': '',
        });
        print('新しいチャットを作成しました: $chatId');
      }

      if (currentUserId == widget.girlUid) {
        final existingMessages = await _firestore
            .collection('chats')
            .doc(chatId)
            .collection('messages')
            .limit(1)
            .get();

        if (existingMessages.docs.isEmpty) {
          await _sendMessage(
            '${widget.customerData['nickname']}さん、はじめまして！${widget.girlData['nickname']}です♪\nプロフィールを見ていただいてありがとうございます。',
            widget.girlUid,
          );
        }
      }
    } catch (e) {
      print('初回メッセージ作成エラー: $e');
    }
  }

  Future<void> _sendMessage(String text, String senderId) async {
    if (text.trim().isEmpty) return;

    try {
      await _firestore.collection('chats').doc(chatId).set({
        'participants': [widget.customerUid, widget.girlUid],
        'lastMessage': text.trim(),
        'lastMessageTime': FieldValue.serverTimestamp(),
        'lastMessageSender': senderId,
        'createdAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      await _firestore
          .collection('chats')
          .doc(chatId)
          .collection('messages')
          .add({
        'text': text.trim(),
        'senderId': senderId,
        'timestamp': FieldValue.serverTimestamp(),
        'isRead': false,
        'chatId': chatId,
      });

      Future.delayed(Duration(milliseconds: 500), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });

    } catch (e) {
      print('メッセージ送信エラー詳細: $e');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('メッセージ送信に失敗しました。もう一度お試しください。'),
          backgroundColor: Colors.red,
          action: SnackBarAction(
            label: '再試行',
            textColor: Colors.white,
            onPressed: () => _sendMessage(text, senderId),
          ),
        ),
      );
    }
  }

  void _handleSendMessage() {
    final text = _messageController.text;
    _messageController.clear();
    _sendMessage(text, currentUserId);
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 0) {
      return '${dateTime.month}/${dateTime.day}';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}時間前';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}分前';
    } else {
      return 'たった今';
    }
  }

  @override
  Widget build(BuildContext context) {
    final isGirl = currentUserId == widget.girlUid;
    final otherUserData = isGirl ? widget.customerData : widget.girlData;
    final appBarColor = isGirl ? Colors.pink.shade600 : Colors.green.shade600;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: appBarColor,
        foregroundColor: Colors.white,
        title: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 2),
              ),
              child: ClipOval(
                child: (!isGirl && widget.girlData['profileImage'] != null) 
                    ? Image.network(
                        widget.girlData['profileImage'],
                        fit: BoxFit.cover,
                        width: 32,
                        height: 32,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: isGirl ? Colors.pink.shade100 : Colors.green.shade100,
                            child: Text(
                              isGirl ? '👨‍💼' : '👩',
                              style: TextStyle(fontSize: 16),
                            ),
                          );
                        },
                      )
                    : Container(
                        color: isGirl ? Colors.pink.shade100 : Colors.green.shade100,
                        child: Text(
                          isGirl ? '👨‍💼' : '👩',
                          style: TextStyle(fontSize: 16),
                        ),
                      ),
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    otherUserData['nickname'] ?? '',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    (otherUserData['isOnline'] == true) ? 'オンライン' : 'オフライン',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.white.withOpacity(0.8),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.grey.shade50, Colors.white],
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                ),
              ),
              child: StreamBuilder<QuerySnapshot>(
                stream: _firestore
                    .collection('chats')
                    .doc(chatId)
                    .collection('messages')
                    .orderBy('timestamp', descending: false)
                    .snapshots(),
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          CircularProgressIndicator(color: appBarColor),
                          SizedBox(height: 16),
                          Text('メッセージを読み込み中...'),
                        ],
                      ),
                    );
                  }

                  if (snapshot.hasError) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline, size: 64, color: Colors.red),
                          SizedBox(height: 16),
                          Text(
                            'メッセージの読み込みに失敗しました',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () {
                              setState(() {});
                            },
                            child: Text('再試行'),
                          ),
                        ],
                      ),
                    );
                  }

                  if (!snapshot.hasData || snapshot.data!.docs.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('💬', style: TextStyle(fontSize: 64)),
                          SizedBox(height: 16),
                          Text(
                            'メッセージを送って会話を始めましょう！',
                            style: TextStyle(
                              fontSize: 16,
                              color: Colors.grey.shade600,
                            ),
                          ),
                        ],
                      ),
                    );
                  }

                  final messages = snapshot.data!.docs;

                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (_scrollController.hasClients) {
                      _scrollController.animateTo(
                        _scrollController.position.maxScrollExtent,
                        duration: Duration(milliseconds: 300),
                        curve: Curves.easeOut,
                      );
                    }
                  });

                  return ListView.builder(
                    controller: _scrollController,
                    padding: EdgeInsets.all(16),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final messageDoc = messages[index];
                      final messageData = messageDoc.data() as Map<String, dynamic>;
                      
                      final text = messageData['text'] ?? '';
                      final senderId = messageData['senderId'] ?? '';
                      final timestamp = messageData['timestamp'] as Timestamp?;
                      final isCurrentUser = senderId == currentUserId;

                      return _buildMessageBubble(
                        text: text,
                        isCurrentUser: isCurrentUser,
                        timestamp: timestamp?.toDate(),
                        appBarColor: appBarColor,
                      );
                    },
                  );
                },
              ),
            ),
          ),
          _buildMessageInput(appBarColor),
        ],
      ),
    );
  }

  Widget _buildMessageBubble({
    required String text,
    required bool isCurrentUser,
    DateTime? timestamp,
    required Color appBarColor,
  }) {
    return Align(
      alignment: isCurrentUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(
          bottom: 12,
          left: isCurrentUser ? 48 : 0,
          right: isCurrentUser ? 0 : 48,
        ),
        padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: isCurrentUser ? appBarColor : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(18),
            topRight: Radius.circular(18),
            bottomLeft: Radius.circular(isCurrentUser ? 18 : 4),
            bottomRight: Radius.circular(isCurrentUser ? 4 : 18),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 6,
              offset: Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              text,
              style: TextStyle(
                color: isCurrentUser ? Colors.white : Colors.grey.shade800,
                fontSize: 14,
                height: 1.4,
              ),
            ),
            SizedBox(height: 6),
            Text(
              timestamp != null ? _formatTime(timestamp) : '送信中...',
              style: TextStyle(
                color: isCurrentUser 
                    ? Colors.white.withOpacity(0.7)
                    : Colors.grey.shade500,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput(Color appBarColor) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade300)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 6,
            offset: Offset(0, -3),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Colors.grey.shade300),
              ),
              child: TextField(
                controller: _messageController,
                decoration: InputDecoration(
                  hintText: 'メッセージを入力...',
                  hintStyle: TextStyle(color: Colors.grey.shade500),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                ),
                maxLines: null,
                onSubmitted: (_) => _handleSendMessage(),
                textInputAction: TextInputAction.send,
              ),
            ),
          ),
          SizedBox(width: 12),
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [appBarColor, appBarColor.withOpacity(0.8)],
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: appBarColor.withOpacity(0.3),
                  blurRadius: 6,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: IconButton(
              onPressed: _handleSendMessage,
              icon: Icon(Icons.send, color: Colors.white, size: 20),
              padding: EdgeInsets.all(12),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}
