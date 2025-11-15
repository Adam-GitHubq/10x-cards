-- ============================================================================
-- Enable Row Level Security (RLS) Policies
-- Created: 2025-11-15
-- ============================================================================
-- 
-- Ta migracja włącza RLS i tworzy polityki bezpieczeństwa dla wszystkich tabel.
-- Każdy użytkownik będzie widział tylko swoje dane (na podstawie user_id).
-- ============================================================================

-- ============================================================================
-- 1. WŁĄCZ RLS NA WSZYSTKICH TABELACH
-- ============================================================================

ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_error_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. POLITYKI DLA TABELI: flashcards
-- ============================================================================

-- SELECT: Użytkownicy widzą tylko swoje fiszki
CREATE POLICY "Users can view their own flashcards"
ON flashcards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Użytkownicy mogą tworzyć fiszki tylko z własnym user_id
CREATE POLICY "Users can insert their own flashcards"
ON flashcards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Użytkownicy mogą edytować tylko swoje fiszki
CREATE POLICY "Users can update their own flashcards"
ON flashcards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Użytkownicy mogą usuwać tylko swoje fiszki
CREATE POLICY "Users can delete their own flashcards"
ON flashcards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 3. POLITYKI DLA TABELI: generations
-- ============================================================================

-- SELECT: Użytkownicy widzą tylko swoją historię generowania
CREATE POLICY "Users can view their own generations"
ON generations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Użytkownicy mogą tworzyć generacje tylko z własnym user_id
CREATE POLICY "Users can insert their own generations"
ON generations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Użytkownicy mogą aktualizować tylko swoje generacje
CREATE POLICY "Users can update their own generations"
ON generations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- DELETE: Użytkownicy mogą usuwać tylko swoje generacje
CREATE POLICY "Users can delete their own generations"
ON generations
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================================================
-- 4. POLITYKI DLA TABELI: generation_error_logs
-- ============================================================================

-- SELECT: Użytkownicy widzą tylko swoje logi błędów
CREATE POLICY "Users can view their own error logs"
ON generation_error_logs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT: Użytkownicy mogą tworzyć logi błędów tylko z własnym user_id
CREATE POLICY "Users can insert their own error logs"
ON generation_error_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Uwaga: Logi błędów zazwyczaj nie są edytowane ani usuwane przez użytkowników

-- ============================================================================
-- GOTOWE! 🎉
-- ============================================================================

