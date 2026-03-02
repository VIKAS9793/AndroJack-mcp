// Tool 17: On-Device AI / AICore Guide
// Android 16 shipped AICore and ML Kit Gen AI API — local LLMs on Android, no server round-trip.
// Used by Gmail (Smart Reply), Google Photos (object detection), Pixel Screenshots (semantic search).
// No MCP server covers this. AI tools default to cloud API calls when on-device is now the answer.

export async function androidOnDeviceAiGuide(topic: string): Promise<string> {
  const t = topic.toLowerCase().trim();

  const overview = `
# On-Device AI — Android AICore & ML Kit Gen AI (2025)
Source: https://developer.android.com/ai/aicore
Source: https://developers.google.com/ml-kit/genai

## What On-Device AI Means in 2026

Android 16 added AICore — a system-level service that manages on-device LLMs.
ML Kit Gen AI API lets apps access these models through a standard interface.

Key benefits vs cloud:
- **Zero latency** — no network round-trip
- **Privacy** — data never leaves the device
- **Offline** — works without internet
- **Cost** — no API billing

## Which Google Apps Use It

- **Gmail** — Smart Reply and Smart Compose on Pixel devices (on-device)
- **Google Photos** — object detection, face grouping, on-device search
- **Google Docs** — local summarization on Pixel
- **Pixel Screenshots** — semantic search across screenshot history

## Architecture Pattern — Repository Interface for Swappable Backends

The official Google pattern: wrap ML models behind a repository interface so the
implementation can switch between on-device (AICore) and cloud (Vertex AI) without
touching the UI layer. This is the same MVVM/repository pattern you already know.

\`\`\`kotlin
// Domain layer — platform-agnostic interface
interface AiTextRepository {
  suspend fun summarize(text: String): Result<String>
  suspend fun generateReply(context: String, options: List<String>): Result<String>
  fun isAvailable(): Flow<Boolean>
}

// Data layer — on-device implementation
class OnDeviceAiRepository(
  private val generativeModel: GenerativeModel  // ML Kit Gen AI
) : AiTextRepository {
  override suspend fun summarize(text: String): Result<String> = runCatching {
    val response = generativeModel.generateContent("Summarize: $text")
    response.text ?: throw IllegalStateException("No response from on-device model")
  }
  override fun isAvailable(): Flow<Boolean> = flow {
    emit(GenerativeModel.isAvailable())
  }
}

// Data layer — cloud fallback implementation
class CloudAiRepository(
  private val vertexAi: FirebaseVertexAI
) : AiTextRepository {
  override suspend fun summarize(text: String): Result<String> = runCatching {
    val model = vertexAi.generativeModel("gemini-2.0-flash")
    val response = model.generateContent("Summarize: $text")
    response.text ?: throw IllegalStateException("No response from cloud model")
  }
  override fun isAvailable(): Flow<Boolean> = flowOf(true) // Cloud always available (with network)
}
\`\`\`

Source: https://developer.android.com/ai/aicore
`;

  const setup = `
# On-Device AI — Setup & Initialization
Source: https://developer.android.com/ml-kit/genai/on-device

## Dependencies

\`\`\`toml
# libs.versions.toml
[versions]
mlkit-genai = "0.1.1"  # Check for latest at https://developers.google.com/ml-kit/genai

[libraries]
mlkit-genai-inference = { group = "com.google.mlkit", name = "genai-common", version.ref = "mlkit-genai" }
\`\`\`

\`\`\`kotlin
// build.gradle.kts
implementation(libs.mlkit.genai.inference)
\`\`\`

## Check Model Availability Before Use

On-device models are only available on supported Pixel devices with the model downloaded.
Always check availability and provide a fallback.

\`\`\`kotlin
// Check if on-device AI is available on this device
class AiRepositoryFactory @Inject constructor(
  @ApplicationContext private val context: Context,
  private val cloudRepository: CloudAiRepository
) {
  suspend fun create(): AiTextRepository {
    return if (isOnDeviceAvailable()) {
      val model = GenerativeModel.getInstance(context)
      OnDeviceAiRepository(model)
    } else {
      cloudRepository  // Graceful fallback to cloud
    }
  }

  private suspend fun isOnDeviceAvailable(): Boolean {
    return try {
      GenerativeModel.isAvailable(context)
    } catch (e: Exception) {
      false
    }
  }
}
\`\`\`

## ViewModel Integration

\`\`\`kotlin
@HiltViewModel
class SummaryViewModel @Inject constructor(
  private val aiRepository: AiTextRepository  // Interface — doesn't know if on-device or cloud
) : ViewModel() {

  private val _uiState = MutableStateFlow<SummaryUiState>(SummaryUiState.Idle)
  val uiState: StateFlow<SummaryUiState> = _uiState.asStateFlow()

  fun summarize(text: String) {
    viewModelScope.launch {
      _uiState.value = SummaryUiState.Loading
      aiRepository.summarize(text)
        .onSuccess { summary -> _uiState.value = SummaryUiState.Success(summary) }
        .onFailure { error -> _uiState.value = SummaryUiState.Error(error.message) }
    }
  }
}

sealed interface SummaryUiState {
  data object Idle : SummaryUiState
  data object Loading : SummaryUiState
  data class Success(val summary: String) : SummaryUiState
  data class Error(val message: String?) : SummaryUiState
}
\`\`\`

Source: https://developer.android.com/ml-kit/genai/on-device
`;

  const smartReply = `
# On-Device AI — Smart Reply Pattern (Gmail-Style)
Source: https://developers.google.com/ml-kit/genai/on-device

## Smart Reply Implementation

\`\`\`kotlin
// Domain interface
interface SmartReplyRepository {
  suspend fun getSuggestedReplies(conversationHistory: List<Message>): Result<List<String>>
}

// On-device implementation using ML Kit
class OnDeviceSmartReplyRepository @Inject constructor(
  private val generativeModel: GenerativeModel
) : SmartReplyRepository {

  override suspend fun getSuggestedReplies(
    conversationHistory: List<Message>
  ): Result<List<String>> = runCatching {
    val prompt = buildPrompt(conversationHistory)
    val response = generativeModel.generateContent(prompt)

    // Parse the structured response into reply options
    response.text
      ?.lines()
      ?.filter { it.isNotBlank() }
      ?.take(3)  // Limit to 3 suggestions like Gmail
      ?: emptyList()
  }

  private fun buildPrompt(history: List<Message>): String {
    val conversation = history.takeLast(5).joinToString("\n") { msg ->
      "\${msg.sender}: \${msg.text}"
    }
    return """
      Given this conversation:
      $conversation

      Suggest 3 short, natural reply options (one per line, no numbering, max 10 words each):
    """.trimIndent()
  }
}

// UI — chips that appear above keyboard
@Composable
fun SmartReplySuggestions(
  suggestions: List<String>,
  onSuggestionClick: (String) -> Unit
) {
  if (suggestions.isEmpty()) return

  LazyRow(
    horizontalArrangement = Arrangement.spacedBy(8.dp),
    contentPadding = PaddingValues(horizontal = 16.dp)
  ) {
    items(suggestions) { suggestion ->
      SuggestionChip(
        onClick = { onSuggestionClick(suggestion) },
        label = { Text(suggestion) }
      )
    }
  }
}
\`\`\`

Source: https://developers.google.com/ml-kit/genai
`;

  const mlKit = `
# ML Kit — On-Device ML (Non-Generative)
Source: https://developers.google.com/ml-kit

## ML Kit vs AICore — When to Use Which

| Use Case | Tool |
|----------|------|
| Text classification, entity extraction | ML Kit Text APIs |
| Image labeling, object detection | ML Kit Vision APIs |
| Face detection, pose estimation | ML Kit Vision APIs |
| Barcode/QR scanning | ML Kit Barcode Scanning |
| Translation | ML Kit Translation |
| Free-form text generation, summarization, Q&A | AICore / ML Kit Gen AI |

## Common ML Kit Setup

\`\`\`toml
[versions]
mlkit = "19.0.3"

[libraries]
# Pick only what you need — each is a separate dependency
mlkit-text-recognition = { group = "com.google.mlkit", name = "text-recognition", version.ref = "mlkit" }
mlkit-image-labeling = { group = "com.google.mlkit", name = "image-labeling", version.ref = "mlkit" }
mlkit-barcode-scanning = { group = "com.google.mlkit", name = "barcode-scanning", version.ref = "mlkit" }
mlkit-face-detection = { group = "com.google.mlkit", name = "face-detection", version.ref = "mlkit" }
mlkit-translation = { group = "com.google.mlkit", name = "translate", version.ref = "mlkit" }
\`\`\`

## Architecture Pattern — ML Models Behind Repository Interfaces

\`\`\`kotlin
// SAME pattern as AICore — ML models are implementation details, not domain concerns
interface ImageAnalysisRepository {
  suspend fun labelImage(bitmap: Bitmap): Result<List<String>>
}

class MlKitImageAnalysisRepository @Inject constructor() : ImageAnalysisRepository {
  private val labeler = ImageLabeling.getClient(ImageLabelerOptions.DEFAULT_OPTIONS)

  override suspend fun labelImage(bitmap: Bitmap): Result<List<String>> = runCatching {
    val inputImage = InputImage.fromBitmap(bitmap, 0)
    labeler.process(inputImage).await()
      .filter { it.confidence > 0.7f }
      .map { it.text }
  }
}
\`\`\`

Source: https://developers.google.com/ml-kit
`;

  if (t.includes("smart reply") || t.includes("suggestion")) return smartReply;
  if (t.includes("setup") || t.includes("install") || t.includes("depend") || t.includes("init")) return setup;
  if (t.includes("ml kit") || t.includes("mlkit") || t.includes("vision") || t.includes("barcode") || t.includes("label")) return mlKit;

  return overview + "\n\n---\n\n" +
    "**Query topics:** 'setup' (dependencies + initialization), 'smart reply' (Gmail-style suggestions), " +
    "'ml kit' (non-generative on-device ML — vision, text, barcode)\n\n" +
    "Source: https://developer.android.com/ai";
}
