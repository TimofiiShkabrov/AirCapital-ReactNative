import en from "./en.json";
import es from "./es.json";
import de from "./de.json";
import nb from "./nb.json";
import ru from "./ru.json";
import uk from "./uk.json";
import fr from "./fr.json";
import pl from "./pl.json";
import bg from "./bg.json";
import cs from "./cs.json";
import da from "./da.json";
import el from "./el.json";
import et from "./et.json";
import fi from "./fi.json";
import hr from "./hr.json";
import hu from "./hu.json";
import is from "./is.json";
import it from "./it.json";
import lb from "./lb.json";
import lt from "./lt.json";
import lv from "./lv.json";
import mt from "./mt.json";
import nl from "./nl.json";
import nn from "./nn.json";
import pt from "./pt.json";
import rm from "./rm.json";
import ro from "./ro.json";
import sk from "./sk.json";
import sl from "./sl.json";
import sv from "./sv.json";
import ar from "./ar.json";
import type { LanguageCode } from "../languages";

export type MonitorKey = keyof typeof en;
export const catalogs = {
  en,
  es,
  de,
  nb,
  ru,
  uk,
  fr,
  pl,
  bg,
  cs,
  da,
  el,
  et,
  fi,
  hr,
  hu,
  is,
  it,
  lb,
  lt,
  lv,
  mt,
  nl,
  nn,
  pt,
  rm,
  ro,
  sk,
  sl,
  sv,
  ar,
} satisfies Record<LanguageCode, Record<MonitorKey, string>>;
