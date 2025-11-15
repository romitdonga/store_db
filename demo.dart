import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class PhoneSearchScreen extends StatefulWidget {
  final String apiBase; // e.g. http://localhost:3000/api
  final String bearerToken;
  final int debounceMs;
  final int limit;

  const PhoneSearchScreen({
    super.key,
    required this.apiBase,
    required this.bearerToken,
    this.debounceMs = 300,
    this.limit = 10,
  });

  @override
  State<PhoneSearchScreen> createState() => _PhoneSearchScreenState();
}

class _PhoneSearchScreenState extends State<PhoneSearchScreen> {
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _nameCtrl = TextEditingController();

  Timer? _debounce;
  int _requestId = 0;

  bool _validIndianPrefix(String s) {
    final d = s.replaceAll(RegExp(r'\\D+'), '');
    return d.length >= 3 && RegExp(r'^[6-9][0-9]{2,}\$').hasMatch(d);
  }

  Future<List<Map<String, String>>> _query(String input) async {
    _debounce?.cancel();
    final completer = Completer<List<Map<String, String>>>();

    _debounce = Timer(Duration(milliseconds: widget.debounceMs), () async {
      final prefix = input.trim();
      if (!_validIndianPrefix(prefix)) {
        completer.complete(const []);
        return;
      }

      final reqId = ++_requestId;
      final uri = Uri.parse(
        '${widget.apiBase}/sales/search/phone?prefix=${Uri.encodeQueryComponent(prefix)}&limit=${widget.limit}',
      );

      try {
        final res = await http.get(
          uri,
          headers: { 'Authorization': 'Bearer ${widget.bearerToken}' },
        );

        if (!mounted || reqId != _requestId) return;

        if (res.statusCode == 200) {
          final data = json.decode(res.body) as Map<String, dynamic>;
          final List<dynamic> results = data['results'] ?? [];
          final options = results.map((e) {
            return {
              'phone': (e['customerPhone'] ?? '').toString(),
              'name': (e['customerName'] ?? '').toString(),
            };
          }).toList();
          completer.complete(options);
        } else {
          completer.complete(const []);
        }
      } catch (_) {
        if (!completer.isCompleted) completer.complete(const []);
      }
    });

    return completer.future;
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _phoneCtrl.dispose();
    _nameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Phone Autocomplete')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Autocomplete<Map<String, String>>(
              displayStringForOption: (opt) => '${opt['phone']} — ${opt['name']}',
              optionsBuilder: (TextEditingValue tev) async {
                final text = tev.text;
                if (text.isEmpty) return const [];
                return await _query(text);
              },
              onSelected: (opt) {
                _phoneCtrl.text = opt['phone'] ?? '';
                _nameCtrl.text = opt['name'] ?? '';
              },
              fieldViewBuilder: (context, textController, focusNode, onFieldSubmitted) {
                return TextField(
                  controller: textController,
                  focusNode: focusNode,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Search Phone (Indian)',
                    hintText: 'Type 98, 987, etc.',
                  ),
                  onSubmitted: (_) => onFieldSubmitted(),
                );
              },
              optionsViewBuilder: (context, onSelected, options) {
                return Align(
                  alignment: Alignment.topLeft,
                  child: Material(
                    elevation: 4,
                    child: SizedBox(
                      width: 420,
                      child: ListView(
                        shrinkWrap: true,
                        children: options.map((opt) {
                          return ListTile(
                            title: Text(opt['phone'] ?? ''),
                            subtitle: Text(opt['name'] ?? ''),
                            onTap: () => onSelected(opt),
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Customer Name'),
            ),
          ],
        ),
      ),
    );
  }
}