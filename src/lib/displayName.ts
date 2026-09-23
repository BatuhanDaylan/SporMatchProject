type Named = { display_name?: string | null; username?: string | null } | null | undefined;

/** Görünen ad → kullanıcı adı → "Sporcu" yedeği. Profil/sahip/yazar gibi kişi nesnelerinde tekrar eden desen. */
export function displayName(person: Named): string {
  return person?.display_name || person?.username || 'Sporcu';
}
